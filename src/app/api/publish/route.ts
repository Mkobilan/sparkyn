import { createClient } from '@/lib/supabase'
import { metaService } from '@/services/social/meta'
import { tiktokService } from '@/services/social/tiktok'
import { youtubeService } from '@/services/social/youtube'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { postId } = await request.json()

    // 1. Fetch post and user social accounts
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('*, user:user_id(profiles(*), social_accounts(*))')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const results: any = {}
    const socialAccounts = (post as any).user.social_accounts

    // 2. Publish to each platform
    for (const platform of post.platforms) {
      const account = socialAccounts.find((a: any) => a.platform === platform)
      
      if (!account || !account.access_token) {
        results[platform] = { error: 'No connected account' }
        continue
      }

      let currentAccessToken = account.access_token;
      // TOKEN REFRESH LOGIC
      try {
        const isExpired = account.expires_at && new Date(account.expires_at).getTime() < Date.now() + 300000;
        if (isExpired && account.refresh_token) {
          if (platform === 'youtube') {
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
        console.error("Background token refresh failed:", refreshErr);
      }

      try {
        if (platform === 'facebook') {
          results[platform] = await metaService.publishToFacebook(
            currentAccessToken, 
            account.platform_user_id, 
            { imageUrl: post.image_url, caption: post.caption }
          )
        } else if (platform === 'instagram') {
          results[platform] = await metaService.publishToInstagram(
            currentAccessToken, 
            account.platform_user_id, 
            { imageUrl: post.image_url, caption: post.caption }
          )
        } else if (platform === 'tiktok') {
          results[platform] = await tiktokService.publishVideo(
            currentAccessToken, 
            { videoUrl: post.image_url, caption: post.caption } 
          )
        } else if (platform === 'youtube') {
          results[platform] = await youtubeService.publishShort(
            currentAccessToken,
            { 
              videoUrl: post.image_url, 
              title: post.hook || 'New Post', 
              description: post.caption 
            }
          )
        }
      } catch (e: any) {
        results[platform] = { error: e.message }
      }
    }

    // 3. Update post status based on results
    const hasFailures = Object.values(results).some((r: any) => r.error)
    const newStatus = hasFailures ? (post.retry_count >= 2 ? 'failed' : 'scheduled') : 'published'

    await supabase
      .from('scheduled_posts')
      .update({ 
        status: newStatus,
        retry_count: hasFailures ? post.retry_count + 1 : post.retry_count,
        error_message: hasFailures ? JSON.stringify(results) : null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', postId)

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('Publish API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
