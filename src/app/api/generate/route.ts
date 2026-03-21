import { createClient } from '../../../lib/supabase'
import { supabaseAdmin } from '../../../lib/supabase-admin'
import { aiService } from '../../../services/ai'
import { metaService } from '../../../services/social/meta'
import { youtubeService } from '../../../services/social/youtube'
import { tiktokService } from '../../../services/social/tiktok'
import { NextResponse } from 'next/server'
import { getTierLimits } from '../../../lib/pricing'

// Video generation (AI images + TTS + FFmpeg) needs extended timeout
export const maxDuration = 60; // seconds
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { accountId, publishNow, scheduledAt, isVideo } = await request.json().catch(() => ({}));
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    let query = supabase.from('social_accounts').select('*').eq('user_id', user.id).eq('is_active', true)
    if (accountId) query = query.eq('id', accountId);

    const { data: accounts, error: accountsError } = await query
    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No active accounts' }, { status: 400 });
    }

    const generatedPosts = []
    const generationErrors: string[] = []
    const tierLimits = getTierLimits(profile.subscription_tier);

    // Get today's start and end times for limit checking
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    for (const account of accounts) {
      // 0. CHECK DAILY LIMIT
      const { count: todayCount } = await supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('platform_account_id', account.id)
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString());
      
      if ((todayCount || 0) >= tierLimits.postsPerDay) {
        console.log(`Limit reached for ${account.platform_name}: ${todayCount}/${tierLimits.postsPerDay}`);
        generationErrors.push(`[${account.platform_name}] Daily limit reached (${tierLimits.postsPerDay} posts/day). Upgrade for more.`);
        continue;
      }

      console.log(`Processing: ${account.platform_name}`)
      let currentAccessToken = account.access_token;

      // TOKEN REFRESH LOGIC
      try {
        const isExpired = account.expires_at && new Date(account.expires_at).getTime() < Date.now() + 300000;
        if (isExpired && account.refresh_token) {
          console.log(`Token expired for ${account.platform}. Refreshing...`);
          if (account.platform === 'youtube') {
            const credentials = await youtubeService.refreshAccessToken(account.refresh_token);
            if (credentials.access_token) {
                currentAccessToken = credentials.access_token;
                await supabase.from('social_accounts').update({
                    access_token: credentials.access_token,
                    expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : new Date(Date.now() + 3600 * 1000).toISOString()
                }).eq('id', account.id);
                console.log("YouTube token refreshed successfully.");
            }
          }
        }
      } catch (refreshErr) {
        console.error("Token refresh failed:", refreshErr);
      }

      try {
        const imageContext = `${account.metadata?.industry || profile.industry} business - ${account.metadata?.description || profile.business_description}`;
        const isVideoRequest = account.platform === 'tiktok' || account.platform === 'instagramreels' || account.platform === 'youtube' || isVideo;

        // ── STEP 1: AI CONTENT & SCRIPT GENERATION (parallel) ──
        console.log(`[Generate] Step 1: AI content generation for ${account.platform}`);
        console.time(`ai-gen-${account.platform}`);
        const [content, videoScript] = await Promise.all([
          aiService.generateContent({
            businessName: account.metadata?.business_name || profile.business_name,
            industry: account.metadata?.industry || profile.industry,
            niche: account.metadata?.niche || profile.niche_description,
            description: account.metadata?.description || profile.business_description,
            goal: account.metadata?.goal || profile.primary_goal,
            tone: account.content_strategy || profile.content_tone,
            platform: account.platform as any,
            websiteUrl: profile.website_url
          }),
          isVideoRequest
            ? aiService.generateShortVideoScript(imageContext, account.metadata?.description || profile.business_description)
            : Promise.resolve(null)
        ]);
        console.timeEnd(`ai-gen-${account.platform}`);

        if (!content) throw new Error("AI returned no text content");

        // ── STEP 2: MEDIA GENERATION (inline — no deferral) ──
        console.log(`[Generate] Step 2: Media generation (${isVideoRequest ? 'VIDEO' : 'IMAGE'}) for ${account.platform}`);
        console.time(`media-gen-${account.platform}`);
        let mediaDataUri: string;
        let ttsStatus = 'n/a';

        if (isVideoRequest && videoScript) {
          // Generate 1 image for the video (keep it fast)
          const imageBase64 = await aiService.generateImage(
            `Context: ${imageContext}. Subject: ${videoScript.imagePrompts[0]}`,
            content.caption, 512, 896
          );
          // Compile video with FFmpeg
          const { videoService } = await import('../../../services/video');
          const videoResult = await videoService.compileShortVideo([imageBase64], videoScript.script);
          mediaDataUri = videoResult.videoDataUri;
          ttsStatus = videoResult.ttsStatus;
          console.log(`[Generate] Video compiled. TTS: ${ttsStatus}`);
        } else {
          // Generate a single image
          mediaDataUri = await aiService.generateImage(imageContext, content.caption, 1024, 1024);
        }
        console.timeEnd(`media-gen-${account.platform}`);

        // ── STEP 3: UPLOAD TO SUPABASE STORAGE ──
        console.log(`[Generate] Step 3: Uploading media to storage`);
        let mediaUrl: string;
        let bytes: Buffer;
        let contentType: string;

        if (mediaDataUri.startsWith('data:')) {
          contentType = mediaDataUri.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
          bytes = Buffer.from(mediaDataUri.split(',')[1], 'base64');
        } else {
          // It's a URL (fallback from image generation)
          const res = await fetch(mediaDataUri);
          bytes = Buffer.from(await res.arrayBuffer());
          contentType = res.headers.get('content-type') || 'image/jpeg';
        }

        const ext = contentType.includes('video') ? 'mp4' : 'jpg';
        const filename = `media_${user.id}_${Date.now()}.${ext}`;
        
        const { error: uploadErr } = await supabaseAdmin.storage
          .from('generated-images')
          .upload(filename, bytes, { contentType });
        
        if (uploadErr) {
          throw new Error(`Storage upload failed: ${uploadErr.message}`);
        }
        
        mediaUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;
        console.log(`[Generate] Media uploaded: ${mediaUrl.slice(0, 80)}... (${bytes.length} bytes)`);

        // ── STEP 4: PUBLISH OR SCHEDULE ──
        const scheduledTime = scheduledAt ? new Date(scheduledAt) : new Date();
        const shouldPublishNow = !scheduledAt || publishNow;
        
        let status = 'scheduled';
        let publishedAt = null;
        let platformPostId = null;
        let channelTitle = null;
        let publishError = null;

        if (shouldPublishNow) {
          console.log(`[Generate] Step 4: Publishing to ${account.platform} NOW`);
          const fullCaption = `${content.hook || ''}\n\n${content.caption}\n\n${content.cta || ''}\n\n${(content.hashtags?.split(' ') || []).join(' ')}`.trim();
          
          try {
            let pubResult: any;

            if (account.platform === 'facebook') {
              pubResult = await metaService.publishToFacebook(currentAccessToken, account.platform_user_id, {
                imageUrl: mediaUrl,
                caption: fullCaption,
                base64Image: !isVideoRequest ? mediaDataUri.split(',')[1] : undefined,
                isVideo: isVideoRequest
              });
            } else if (account.platform === 'instagram') {
              pubResult = await metaService.publishToInstagram(currentAccessToken, account.platform_user_id, {
                imageUrl: mediaUrl,
                caption: fullCaption,
                isVideo: isVideoRequest
              });
            } else if (account.platform === 'youtube') {
              pubResult = await youtubeService.publishShort(currentAccessToken, {
                videoUrl: mediaUrl,
                title: content.hook || 'New Short',
                description: content.caption
              });
              channelTitle = pubResult?.channelTitle;
            } else if (account.platform === 'tiktok') {
              pubResult = await tiktokService.publishVideo(currentAccessToken, {
                videoUrl: mediaUrl,
                caption: content.caption
              });
            }

            const resultId = pubResult?.id || pubResult?.data?.id;
            if (resultId) {
              status = 'published';
              publishedAt = new Date().toISOString();
              platformPostId = resultId;
              console.log(`[Generate] Published to ${account.platform}! ID: ${resultId}`);
            } else {
              // Publishing returned but no ID — extract error
              const errMsg = pubResult?.error?.message || JSON.stringify(pubResult?.error || pubResult || 'Unknown');
              publishError = errMsg;
              status = 'failed';
              console.error(`[Generate] Publish returned no ID for ${account.platform}:`, errMsg);
            }
          } catch (pubErr: any) {
            publishError = pubErr.message || 'Unknown publish error';
            status = 'failed';
            console.error(`[Generate] Publish exception for ${account.platform}:`, pubErr.message);
          }
        } else {
          console.log(`[Generate] Step 4: Scheduling for ${scheduledTime.toISOString()}`);
          status = 'media_ready'; // Media is already generated, cron just needs to publish at the right time
        }

        // ── STEP 5: SAVE TO DATABASE ──
        const { data: post } = await supabase.from('scheduled_posts').insert({
          user_id: user.id,
          platforms: [account.platform],
          platform_account_id: account.id,
          hook: content.hook,
          caption: content.caption,
          cta: content.cta,
          hashtags: content.hashtags?.split(' ') || [],
          image_url: mediaUrl,
          scheduled_at: scheduledTime.toISOString(),
          published_at: publishedAt,
          status: status,
          platform_post_id: platformPostId,
          error_message: publishError
        }).select().single();

        if (post) {
          (post as any)._channelTitle = channelTitle;
          (post as any)._ttsStatus = ttsStatus;
          (post as any)._publishError = publishError;
          generatedPosts.push(post);
        }

        // If publishing failed, add to error list for the response
        if (publishError) {
          generationErrors.push(`[${account.platform_name}] Published media but platform rejected it: ${publishError}`);
        }

      } catch (loopErr: any) {
        console.error(`[Generate] Fatal loop failure for ${account.platform_name}:`, loopErr);
        generationErrors.push(`[${account.platform_name}] ${loopErr.message || 'Unknown Failure'}`);
      }
    }

    if (generatedPosts.length === 0) throw new Error(generationErrors.join(' | '));

    // Build response with real status info
    const publishedPosts = generatedPosts.filter(p => p.status === 'published');
    const failedPosts = generatedPosts.filter(p => p.status === 'failed');
    const scheduledPosts = generatedPosts.filter(p => p.status === 'media_ready' || p.status === 'scheduled');
    
    const publishLinks = publishedPosts
      .filter(p => p.platform_post_id)
      .map(p => ({ 
        platform: p.platforms[0], 
        url: p.platforms[0] === 'youtube' ? `https://youtube.com/watch?v=${p.platform_post_id}` : null,
        channelTitle: (p as any)._channelTitle
      }))
      .filter(link => link.url);

    return NextResponse.json({ 
      success: failedPosts.length === 0,
      posts: generatedPosts, 
      publishLinks,
      summary: {
        published: publishedPosts.length,
        failed: failedPosts.length,
        scheduled: scheduledPosts.length,
      },
      errors: generationErrors.length > 0 ? generationErrors : undefined,
      debug: {
        ttsStatus: generatedPosts.length > 0 ? (generatedPosts[0] as any)._ttsStatus : null,
      }
    });

  } catch (error: any) {
    console.error('[Generate] API 500:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
