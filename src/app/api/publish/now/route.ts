import { createClient } from '../../../../lib/supabase'
import { metaService } from '../../../../services/social/meta'
import { youtubeService } from '../../../../services/social/youtube'
import { tiktokService } from '../../../../services/social/tiktok'
import { NextResponse } from 'next/server'

// Publishing is usually fast (5-15s) but needs its own 30-60s window
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { postId } = await request.json().catch(() => ({}));
    if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch Post, Account, and Profile
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('*, social_accounts(*), profiles(*)')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.status === 'published') return NextResponse.json({ error: 'Post already published' }, { status: 400 });

    const account = (post as any).social_accounts;
    const profile = (post as any).profiles;
    const metadata = (post as any).metadata || {};
    const { isVideo } = metadata;

    if (!account) return NextResponse.json({ error: 'Social account not found' }, { status: 404 });

    console.log(`[PublishNow] Publishing post ${postId} to ${account.platform}`);

    // 2. Token Refresh Logic
    let currentAccessToken = account.access_token;
    try {
        const isExpired = account.expires_at && new Date(account.expires_at).getTime() < Date.now() + 300000;
        if (isExpired && account.refresh_token) {
          if (account.platform === 'youtube') {
            const credentials = await youtubeService.refreshAccessToken(account.refresh_token);
            if (credentials.access_token) {
                currentAccessToken = credentials.access_token;
                await supabase.from('social_accounts').update({
                    access_token: credentials.access_token,
                    expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : new Date(Date.now() + 3600 * 1000).toISOString()
                }).eq('id', account.id);
            }
          }
        }
    } catch (refreshErr) {
        console.error("[PublishNow] Token refresh failed:", refreshErr);
    }

    // 3. Publish
    const fullCaption = `${post.hook || ''}\n\n${post.caption}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`.trim();
    let pubResult: any;
    let publishError = null;

    try {
        if (account.platform === 'facebook') {
            pubResult = await metaService.publishToFacebook(currentAccessToken, account.platform_user_id, {
                imageUrl: post.image_url,
                caption: fullCaption,
                isVideo: isVideo
            });
        } else if (account.platform === 'instagram') {
            pubResult = await metaService.publishToInstagram(currentAccessToken, account.platform_user_id, {
                imageUrl: post.image_url,
                caption: fullCaption,
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
    } catch (pubErr: any) {
        publishError = pubErr.message || 'Unknown publish error';
    }

    const resultId = pubResult?.id || pubResult?.data?.id;
    if (resultId && !publishError) {
        await supabase.from('scheduled_posts').update({
            status: 'published',
            published_at: new Date().toISOString(),
            platform_post_id: resultId,
            error_message: null
        }).eq('id', postId);

        return NextResponse.json({ 
            success: true, 
            platformPostId: resultId,
            platform: account.platform,
            url: account.platform === 'youtube' ? `https://youtube.com/watch?v=${resultId}` : null
        });
    } else {
        const errorMsg = publishError || pubResult?.error?.message || JSON.stringify(pubResult?.error || pubResult || 'Unknown');
        await supabase.from('scheduled_posts').update({
            status: 'failed',
            error_message: errorMsg
        }).eq('id', postId);

        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[PublishNow] API 500:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
