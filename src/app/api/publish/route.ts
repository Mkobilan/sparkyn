import { createClient } from '@/lib/supabase'
import { metaService } from '@/services/social/meta'
import { tiktokService } from '@/services/social/tiktok'
import { youtubeService } from '@/services/social/youtube'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
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

      try {
        if (platform === 'facebook') {
          results[platform] = await metaService.publishToFacebook(
            account.access_token, 
            account.platform_user_id, 
            { imageUrl: post.image_url, caption: post.caption }
          )
        } else if (platform === 'instagram') {
          results[platform] = await metaService.publishToInstagram(
            account.access_token, 
            account.platform_user_id, 
            { imageUrl: post.image_url, caption: post.caption }
          )
        } else if (platform === 'tiktok') {
          results[platform] = await tiktokService.publishVideo(
            account.access_token, 
            { videoUrl: post.image_url, caption: post.caption } // Assuming videoUrl is image_url for now or handled
          )
        } else if (platform === 'youtube') {
          results[platform] = await youtubeService.publishShort(
            account.access_token,
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
