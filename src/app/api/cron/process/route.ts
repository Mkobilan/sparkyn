import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

// Allow both POST (from GitHub Actions) and GET (from self-trigger)
export async function POST(request: Request) {
  return handleCron(request);
}
export async function GET(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  // 1. Verify Authorization
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[Cron] Auth failed. Got:', authHeader?.slice(0, 20), '...');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = [];

  try {
    // --- STAGE 1: MEDIA GENERATION ---
    // Use .like() to match the placeholder URL prefix (catches both plain and &type=video variants)
    const PLACEHOLDER_PREFIX = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b%';
    const { data: mediaPending, error: mediaErr } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, social_accounts!platform_account_id(*), profiles!user_id(*)')
      .or('status.eq.content_ready,and(status.eq.scheduled,image_url.like.https://images.unsplash.com/photo-1544367567-0f2fcb009e0b%)')
      .limit(5);

    if (mediaErr) {
      console.error('[Cron Stage 1] Query error:', mediaErr.message);
    }

    if (mediaPending && mediaPending.length > 0) {
      console.log(`[Cron Stage 1] Found ${mediaPending.length} posts needing media generation.`);

      for (const post of mediaPending) {
        try {
          console.log(`[Cron Stage 1] Generating media for post ${post.id} (platform: ${post.platforms?.[0] || 'unknown'})`);
          const account = post.social_accounts;
          const profile = post.profiles;

          if (!account || !profile) {
            console.error(`[Cron Stage 1] Missing account or profile for post ${post.id}. account=${!!account}, profile=${!!profile}`);
            await supabaseAdmin.from('scheduled_posts').update({ 
              status: 'failed', 
              error_message: 'Missing account or profile data' 
            }).eq('id', post.id);
            results.push(`${post.id}: failed (missing data)`);
            continue;
          }

          // Check the URL for the type flag OR the platform default
          const isVideo = post.image_url?.includes('type=video') || 
                          ['tiktok', 'instagramreels', 'youtube'].includes(account.platform);

          const imageContext = `${account?.metadata?.industry || profile?.industry || 'Business'} business - ${account?.metadata?.description || profile?.business_description || 'General'}`;
          const { aiService } = await import('@/services/ai');

          let finalMediaUrl = '';
          if (isVideo) {
            console.log(`[Cron Stage 1] Video pipeline for post ${post.id}`);
            const { script, imagePrompts } = await aiService.generateShortVideoScript(imageContext, post.caption);
            const imageBase64 = await aiService.generateImage(
              `Context: ${imageContext}. Subject: ${imagePrompts[0]}`, 
              post.caption, 512, 896
            );
            const { videoService } = await import('@/services/video');
            const result = await videoService.compileShortVideo([imageBase64], script);
            finalMediaUrl = result.videoDataUri;
            console.log(`[Cron Stage 1] Video compiled for post ${post.id}. TTS: ${result.ttsStatus}`);
          } else {
            console.log(`[Cron Stage 1] Image pipeline for post ${post.id}`);
            finalMediaUrl = await aiService.generateImage(imageContext, post.caption, 1024, 1024);
          }

          // Upload to storage
          let bytes: Buffer;
          let contentType: string;
          if (finalMediaUrl.startsWith('data:')) {
            contentType = finalMediaUrl.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
            bytes = Buffer.from(finalMediaUrl.split(',')[1], 'base64');
          } else {
            const res = await fetch(finalMediaUrl);
            bytes = Buffer.from(await res.arrayBuffer());
            contentType = res.headers.get('content-type') || 'image/jpeg';
          }
          const ext = contentType.includes('video') ? 'mp4' : 'jpg';
          const filename = `media_${post.id}_${Date.now()}.${ext}`;
          
          const { error: uploadErr } = await supabaseAdmin.storage
            .from('generated-images')
            .upload(filename, bytes, { contentType: contentType });
          
          if (uploadErr) {
            throw new Error(`Storage upload failed: ${uploadErr.message}`);
          }
          
          const publicUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;

          await supabaseAdmin.from('scheduled_posts').update({
            image_url: publicUrl,
            status: 'media_ready'
          }).eq('id', post.id);

          console.log(`[Cron Stage 1] Media ready for ${post.id}: ${publicUrl.slice(0, 80)}...`);
          results.push(`${post.id}: media_ready`);
        } catch (err: any) {
          console.error(`[Cron Stage 1] Failed for ${post.id}:`, err.message);
          // Mark as failed after logging the error — don't let it sit forever
          await supabaseAdmin.from('scheduled_posts').update({ 
            status: 'failed',
            error_message: `Media generation failed: ${err.message?.slice(0, 200)}`
          }).eq('id', post.id);
          results.push(`${post.id}: failed (${err.message?.slice(0, 50)})`);
        }
      }
    }

    // --- STAGE 2: PUBLISHING ---
    // Fetch posts that have media ready and whose scheduled time has passed
    const { data: publishPending, error: pubErr } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, social_accounts!platform_account_id(*)')
      .eq('status', 'media_ready')
      .lte('scheduled_at', new Date().toISOString())
      .limit(5);

    if (pubErr) {
      console.error('[Cron Stage 2] Query error:', pubErr.message);
    }

    if (publishPending && publishPending.length > 0) {
      console.log(`[Cron Stage 2] Found ${publishPending.length} posts ready to publish.`);

      for (const post of publishPending) {
        try {
          const account = post.social_accounts;
          if (!account) {
            console.error(`[Cron Stage 2] No account for post ${post.id}`);
            await supabaseAdmin.from('scheduled_posts').update({ status: 'failed', error_message: 'No linked account' }).eq('id', post.id);
            results.push(`${post.id}: publish_failed (no account)`);
            continue;
          }

          console.log(`[Cron Stage 2] Publishing post ${post.id} to ${account.platform}`);
          
          let currentAccessToken = account.access_token;
          
          // Token refresh
          try {
            const isExpired = account.expires_at && new Date(account.expires_at).getTime() < Date.now() + 300000;
            if (isExpired && account.refresh_token) {
              if (account.platform === 'youtube') {
                const { youtubeService } = await import('@/services/social/youtube');
                const credentials = await youtubeService.refreshAccessToken(account.refresh_token);
                if (credentials.access_token) {
                  currentAccessToken = credentials.access_token;
                  await supabaseAdmin.from('social_accounts').update({
                    access_token: credentials.access_token,
                    expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : new Date(Date.now() + 3600 * 1000).toISOString()
                  }).eq('id', account.id);
                  console.log(`[Cron Stage 2] YouTube token refreshed for account ${account.id}`);
                }
              }
            }
          } catch (refreshErr: any) {
            console.error(`[Cron Stage 2] Token refresh failed for ${account.id}:`, refreshErr.message);
          }

          const isVideo = account.platform === 'tiktok' || account.platform === 'instagramreels' || account.platform === 'youtube' ||
                          post.image_url?.includes('.mp4');

          const { metaService } = await import('@/services/social/meta');
          const { youtubeService } = await import('@/services/social/youtube');
          const { tiktokService } = await import('@/services/social/tiktok');

          const pubCaption = `${post.hook || ''}\n\n${post.caption}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`.trim();

          let pubResult: any;
          if (account.platform === 'facebook') {
            pubResult = await metaService.publishToFacebook(currentAccessToken, account.platform_user_id, {
              imageUrl: post.image_url,
              caption: pubCaption,
              isVideo: isVideo
            });
          } else if (account.platform === 'instagram') {
            pubResult = await metaService.publishToInstagram(currentAccessToken, account.platform_user_id, {
              imageUrl: post.image_url,
              caption: pubCaption,
              isVideo: isVideo
            });
          } else if (account.platform === 'youtube') {
            pubResult = await youtubeService.publishShort(currentAccessToken, {
              videoUrl: post.image_url,
              title: post.hook || 'New Short',
              description: post.caption
            });
          } else if (account.platform === 'tiktok') {
            pubResult = await tiktokService.publishVideo(currentAccessToken, {
              videoUrl: post.image_url,
              caption: post.caption
            });
          }

          const postId = pubResult?.id || pubResult?.data?.id;
          if (postId) {
            await supabaseAdmin.from('scheduled_posts').update({
              status: 'published',
              published_at: new Date().toISOString(),
              platform_post_id: postId
            }).eq('id', post.id);
            console.log(`[Cron Stage 2] Post ${post.id} published! Platform ID: ${postId}`);
            results.push(`${post.id}: published`);
          } else {
            const errorMsg = pubResult?.error?.message || JSON.stringify(pubResult?.error || pubResult || 'No response');
            throw new Error(errorMsg);
          }
        } catch (err: any) {
          console.error(`[Cron Stage 2] Failed for ${post.id}:`, err.message);
          await supabaseAdmin.from('scheduled_posts').update({ 
            status: 'failed',
            error_message: `Publish failed: ${err.message?.slice(0, 200)}`
          }).eq('id', post.id);
          results.push(`${post.id}: publish_failed (${err.message?.slice(0, 50)})`);
        }
      }
    }

    if (results.length === 0) {
      return NextResponse.json({ success: true, message: 'Idle — no pending posts' });
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error('[Cron] Fatal error:', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
