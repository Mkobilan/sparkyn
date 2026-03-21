import { createClient } from '../../../lib/supabase'
import { aiService } from '../../../services/ai'
import { metaService } from '../../../services/social/meta'
import { youtubeService } from '../../../services/social/youtube'
import { tiktokService } from '../../../services/social/tiktok'
import { NextResponse } from 'next/server'
import { getTierLimits } from '../../../lib/pricing'

// Video generation (AI images + TTS + FFmpeg) needs extended timeout
export const maxDuration = 60; // seconds (Hobby plan max)
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

      // 0. TOKEN REFRESH LOGIC
      try {
        const isExpired = account.expires_at && new Date(account.expires_at).getTime() < Date.now() + 300000; // 5 min buffer
        if (isExpired && account.refresh_token) {
          console.log(`Token expired for ${account.platform}. Refreshing...`);
          if (account.platform === 'youtube') {
            const credentials = await youtubeService.refreshAccessToken(account.refresh_token);
            if (credentials.access_token) {
                currentAccessToken = credentials.access_token;
                // Update DB
                await supabase.from('social_accounts').update({
                    access_token: credentials.access_token,
                    expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : new Date(Date.now() + 3600 * 1000).toISOString()
                }).eq('id', account.id);
                console.log("YouTube token refreshed successfully.");
            }
          }
          // Note: TikTok refresh could be added here similarly if needed
        }
      } catch (refreshErr) {
        console.error("Token refresh failed:", refreshErr);
        // Continue anyway, maybe the token still works or the error is transient
      }
      try {
        const imageContext = `${account.metadata?.industry || profile.industry} business - ${account.metadata?.description || profile.business_description}`;

        // 1. CONTENT & SCRIPT GENERATION (Parallel for speed)
        console.time(`ai-generation-${account.platform}`);
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
          // Trigger script generation even if we don't know the caption yet (use business description as theme)
          (account.platform === 'tiktok' || account.platform === 'instagramreels' || account.platform === 'youtube' || isVideo)
            ? aiService.generateShortVideoScript(imageContext, account.metadata?.description || profile.business_description)
            : Promise.resolve(null)
        ]);
        console.timeEnd(`ai-generation-${account.platform}`);

        if (!content) throw new Error("AI returned no text content");

        // 2. MEDIA GENERATION DEFERRAL (Zero-Timeout Architecture)
        // We ALWAYS defer media generation to the background cron to avoid 504 timeouts.
        // We set a placeholder URL that the Cron job will later replace.
        // We append ?type=video if it's a video request so the cron knows what to generate.
        const isVideoRequest = account.platform === 'tiktok' || account.platform === 'instagramreels' || account.platform === 'youtube' || isVideo;
        const pendingMediaUrl = `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1080&auto=format&fit=crop${isVideoRequest ? '&type=video' : ''}`;
        let mediaUrl = pendingMediaUrl;
        
        // We save the AI-generated script/metadata in the DB if we have it (videoScript)
        // If not, the Cron will regenerate it.

        // 4. PUBLISHING DEFERRAL
        const scheduledTime = scheduledAt ? new Date(scheduledAt) : new Date();
        // If "Publish Now" was requested, we set the schedule to NOW so the cron picks it up instantly
        let status = 'scheduled';
        let publishedAt = null;
        let platformPostId = null;
        let channelTitle = null;

        // No synchronous publishing block here!
        // We move the publish logic entirely into the Cron job.

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
            platform_post_id: platformPostId
        }).select().single();

        if (post) {
            (post as any)._channelTitle = channelTitle;
            (post as any)._mediaIsPending = true;
            generatedPosts.push(post);
        }
      } catch (loopErr: any) {
        console.error(`Loop failure for ${account.platform_name}:`, loopErr);
        generationErrors.push(`[${account.platform_name}] ${loopErr.message || 'Unknown Failure'}`);
      }
    }

    if (generatedPosts.length === 0) throw new Error(generationErrors.join(' | '));
    
    const publishLinks = generatedPosts
      .filter(p => p.status === 'published' && p.platform_post_id)
      .map(p => ({ 
        platform: p.platforms[0], 
        url: p.platforms[0] === 'youtube' ? `https://youtube.com/watch?v=${p.platform_post_id}` : null,
        // Include channelTitle from the current context if it was just published
        channelTitle: p.platforms[0] === 'youtube' ? (p as any)._channelTitle : null
      }))
      .filter(link => link.url);

    return NextResponse.json({ 
      success: true, 
      posts: generatedPosts, 
      publishLinks,
      debug: {
        errors: generationErrors,
        postCount: generatedPosts.length,
        hasLinks: publishLinks.length > 0,
        mediaSizes: generatedPosts.map(p => (p as any)._mediaSize),
        ttsStatus: generatedPosts.length > 0 ? (generatedPosts[0] as any)._ttsDebug : null,
      }
    });

  } catch (error: any) {
    console.error('API 500:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
