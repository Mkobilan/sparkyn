import { createClient } from '@/lib/supabase'
import { aiService } from '@/services/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 2. Get all active social accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No active social accounts connected' }, { status: 400 })
    }

    const generatedPosts = []

    for (const account of accounts) {
      console.log(`Generating content for ${account.platform} (${account.platform_name})...`)
      try {
        const content = await aiService.generateContent({
          businessName: profile.business_name,
          industry: profile.industry,
          niche: profile.niche_description,
          description: profile.business_description,
          goal: profile.primary_goal,
          tone: account.content_strategy || profile.content_tone, // Use account specific strategy
          postsPerDay: profile.posts_per_day,
          platform: account.platform as any,
          websiteUrl: profile.website_url
        })
        
        if (!content) {
          console.error(`AI returned no content for ${account.platform_name}`)
          continue
        }

        // 3. Generate image (placeholder for now)
        const imageUrl = await aiService.generateImage(profile.business_description, content.caption)

        // 4. Store in scheduled_posts
        const scheduledTime = new Date()
        scheduledTime.setHours(scheduledTime.getHours() + 1) // Default to 1 hour from now

        const { data: post, error: postError } = await supabase
          .from('scheduled_posts')
          .insert({
            user_id: user.id,
            platforms: [account.platform],
            platform_account_id: account.id, // Explicitly link to the account
            hook: content.hook,
            caption: content.caption,
            cta: content.cta,
            hashtags: content.hashtags ? content.hashtags.split(' ') : [],
            image_url: imageUrl,
            scheduled_at: scheduledTime.toISOString(),
            status: 'scheduled'
          })
          .select()
          .single()

        if (post) generatedPosts.push(post)
      } catch (err: any) {
        console.error(`Failed to generate for ${account.platform}:`, err.message)
      }
    }

    return NextResponse.json({ success: true, posts: generatedPosts })
  } catch (error: any) {
    console.error('Overall Generation API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
