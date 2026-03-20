import { createClient } from '@/lib/supabase'
import { aiService } from '@/services/ai'
import { metaService } from '@/services/social/meta'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accountId, publishNow, scheduledAt } = await request.json().catch(() => ({}));
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

    // 2. Get active social accounts
    let query = supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (accountId) {
      query = query.eq('id', accountId)
    }

    const { data: accounts, error: accountsError } = await query

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No active social accounts connected' }, { status: 400 })
    }

    const generatedPosts = []
    const generationErrors: string[] = []

    for (const account of accounts) {
      console.log(`Generating content for ${account.platform} (${account.platform_name})...`)
      try {
        const content = await aiService.generateContent({
          businessName: account.metadata?.business_name || profile.business_name,
          industry: account.metadata?.industry || profile.industry,
          niche: account.metadata?.niche || profile.niche_description,
          description: account.metadata?.description || profile.business_description,
          goal: account.metadata?.goal || profile.primary_goal,
          tone: account.content_strategy || profile.content_tone, // Use account specific strategy
          postsPerDay: profile.posts_per_day,
          platform: account.platform as any,
          websiteUrl: profile.website_url
        })
        
        if (!content) {
          console.error(`AI returned no content for ${account.platform_name}`)
          continue
        }

        // 3. Generate image (base64)
        const accountDescription = account.metadata?.description || profile.business_description;
        const accountIndustry = account.metadata?.industry || profile.industry;
        const imageContext = `${accountIndustry} business - ${accountDescription}`;

        let imageUrl = await aiService.generateImage(imageContext, content.caption)
        let rawBase64ForMeta: string | undefined = undefined;

        // Upload to Supabase to convert to public URL, as Meta API requires it.
        if (imageUrl.startsWith('data:image')) {
          console.log(`Uploading generated base64 image to Supabase...`)
          const contentType = imageUrl.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
          const base64Data = imageUrl.split(',')[1];
          rawBase64ForMeta = base64Data;
          
          // Guaranteed binary safety: decode base64 to standard ArrayBuffer manually
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const ext = contentType === 'image/png' ? 'png' : 'jpg';
          const filename = `generation_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(filename, bytes.buffer, {
              contentType: contentType,
              upsert: false
            });

          if (uploadError) {
            console.error('Failed to upload image to Supabase:', uploadError);
            throw new Error(`Storage Error: ${uploadError.message}`);
          }

          const { data: publicUrlData } = supabase.storage
            .from('generated-images')
            .getPublicUrl(filename);
            
          const appOrigin = new URL(request.url).origin;
          imageUrl = `${appOrigin}/api/public-image?url=${encodeURIComponent(publicUrlData.publicUrl)}`;
          console.log(`Successfully uploaded image to Supabase and proxied: ${imageUrl}`)
          
          // Wait 2000ms to allow Supabase global CDN to propagate before Facebook eagerly fetches it
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 4. Store in scheduled_posts
        const scheduledTime = scheduledAt ? new Date(scheduledAt) : new Date()
        if (!scheduledAt && !publishNow) {
          scheduledTime.setHours(scheduledTime.getHours() + 1) // Default to 1 hour from now
        }

        let status = 'scheduled'
        let publishedAt = null

        if (publishNow) {
          if (account.platform === 'facebook') {
            console.log(`Publishing now to Facebook Page: ${account.platform_name}`)
            const pubResult = await metaService.publishToFacebook(account.access_token, account.platform_user_id, {
              imageUrl: imageUrl,
              caption: `${content.hook}\n\n${content.caption}\n\n${content.cta}\n\n${content.hashtags}`,
              base64Image: rawBase64ForMeta
            })
            
            if (pubResult.id) {
              status = 'published'
              publishedAt = new Date().toISOString()
            } else {
              console.error('Facebook Publish Error:', pubResult)
              status = 'failed'
              throw new Error(`Facebook Publish Error: ${pubResult.error?.message || 'Unknown error'}`)
            }
          } else if (account.platform === 'instagram') {
            console.log(`Publishing now to Instagram: ${account.platform_name}`)
            const pubResult = await metaService.publishToInstagram(account.access_token, account.platform_user_id, {
              imageUrl: imageUrl,
              caption: `${content.hook}\n\n${content.caption}\n\n${content.cta}\n\n${content.hashtags}`
            })
            
            if (pubResult.id) {
              status = 'published'
              publishedAt = new Date().toISOString()
            } else {
              console.error('Instagram Publish Error:', pubResult)
              status = 'failed'
              throw new Error(`Instagram Publish Error: ${pubResult.error?.message || 'Unknown error'}`)
            }
          } else {
            console.log(`Simulating publish now to ${account.platform}: ${account.platform_name}`)
            status = 'published'
            publishedAt = new Date().toISOString()
          }
        }

        const { data: post, error: postError } = await supabase
          .from('scheduled_posts')
          .insert({
            user_id: user.id,
            platforms: [account.platform],
            platform_account_id: account.id,
            hook: content.hook,
            caption: content.caption,
            cta: content.cta,
            hashtags: content.hashtags ? content.hashtags.split(' ') : [],
            image_url: imageUrl,
            scheduled_at: scheduledTime.toISOString(),
            published_at: publishedAt,
            status: status
          })
          .select()
          .single()

        if (postError) {
          console.error('Failed to insert scheduled_post:', postError)
          throw new Error(`DB Error: ${postError.message}`)
        }

        if (post) generatedPosts.push(post)
      } catch (err: any) {
        console.error(`Failed to generate for ${account.platform}:`, err.message)
        generationErrors.push(`[${account.platform_name}] ${err.message}`)
      }
    }

    if (generatedPosts.length === 0 || generationErrors.length > 0) {
      return NextResponse.json({ 
        error: `Errors occurred: ${generationErrors.join(' | ')}` 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, posts: generatedPosts })
  } catch (error: any) {
    console.error('Overall Generation API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
