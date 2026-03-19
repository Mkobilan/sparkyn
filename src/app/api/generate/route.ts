import { createClient } from '@/lib/supabase'
import { aiService } from '@/services/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
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

    // 2. Generate content for each platform
    const platforms = profile.platforms || ['facebook'] // Default
    const generatedPosts = []

    for (const platform of platforms) {
      const content = await aiService.generateContent({
        businessName: profile.business_name,
        industry: profile.industry,
        description: profile.business_description,
        goal: profile.primary_goal,
        tone: profile.content_tone,
        platform: platform as any,
        websiteUrl: profile.website_url
      })

      if (content) {
        // 3. Generate image (placeholder for now)
        const imageUrl = await aiService.generateImage(profile.business_description, content.caption)

        // 4. Store in scheduled_posts
        const scheduledTime = new Date()
        scheduledTime.setHours(scheduledTime.getHours() + 1) // Default to 1 hour from now

        const { data: post, error: postError } = await supabase
          .from('scheduled_posts')
          .insert({
            user_id: user.id,
            platforms: [platform],
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
      }
    }

    return NextResponse.json({ success: true, posts: generatedPosts })
  } catch (error: any) {
    console.error('Generation API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
