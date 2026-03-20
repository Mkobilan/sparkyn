import { createClient } from '../../../lib/supabase'
import { aiService } from '../../../services/ai'
import { metaService } from '../../../services/social/meta'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accountId, publishNow, scheduledAt, isVideo } = await request.json().catch(() => ({}));
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
      console.time(`PostGeneration-${account.id}`);
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

        // 3. Generate media (image or video)
        const accountDescription = account.metadata?.description || profile.business_description;
        const accountIndustry = account.metadata?.industry || profile.industry;
        const imageContext = `${accountIndustry} business - ${accountDescription}`;

        let mediaUrl = '';
        let rawBase64ForMeta: string | undefined = undefined;

        if (account.platform === 'tiktok' || account.platform === 'instagramreels' || isVideo) {
             console.log(`Shorts/Video generation triggered for ${account.platform_name}! Initializing Vercel FFmpeg compiler...`);
             console.time(`VideoTotal-${account.id}`);
             const { script, imagePrompts } = await aiService.generateShortVideoScript(imageContext, content.caption);
             
             console.time(`ImagesFetch-${account.id}`);
             // High-throughput parallel evaluation to defeat strict 10s Serverless Hobby execution timeouts
             // Use 768x1344 (9:16) for videos
             const imagePromises = imagePrompts.map(prompt => 
                 aiService.generateImage(`Context: ${imageContext}. Subject: ${prompt}`, content.caption, 768, 1344)
             );
             const imagesBase64 = await Promise.all(imagePromises);
             console.timeEnd(`ImagesFetch-${account.id}`);
             
             const { videoService } = await import('@/services/video');
             mediaUrl = await videoService.compileShortVideo(imagesBase64, script);
             console.timeEnd(`VideoTotal-${account.id}`);
        } else {
             // Use 1024x1024 (1:1) for standard images to improve Meta Ad-Safety approval (Error 324 fix)
             mediaUrl = await aiService.generateImage(imageContext, content.caption, 1024, 1024);
        }

        // Upload to Supabase to convert to public URL, as Meta API requires it.
        // Captures both local data URIs and external Pollinations URLs to guarantee short, scraper-friendly links
        if (mediaUrl.startsWith('data:') || (mediaUrl.startsWith('http') && !mediaUrl.includes('supabase.co'))) {
          console.log(`Capturing media asset to Supabase storage: ${mediaUrl.slice(0, 50)}...`)
          let bytes: Buffer;
          let contentType: string;

          if (mediaUrl.startsWith('data:')) {
            contentType = mediaUrl.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
            const base64Data = mediaUrl.split(',')[1];
            rawBase64ForMeta = base64Data;
            bytes = Buffer.from(base64Data, 'base64');
          } else {
            // Fetch from external URL (Pollinations Fallback)
            const mediaRes = await fetch(mediaUrl);
            if (!mediaRes.ok) {
                const errText = await mediaRes.text();
                throw new Error(`External Image Fetch Failed (${mediaRes.status}): ${errText.slice(0, 100)}`);
            }
            const arrayBuffer = await mediaRes.arrayBuffer();
            bytes = Buffer.from(arrayBuffer);
            contentType = mediaRes.headers.get('content-type') || 'image/jpeg';
            
            // Safety Check: Ensure we didn't capture a JSON error message as an image
            if (contentType.includes('application/json') || bytes.length < 1000) {
                throw new Error(`External Image Fetch returned invalid data: ${contentType}`);
            }
          }
          
          console.log(`Media captured. Byte size: ${bytes.length}`);
          
          
          const isVideo = contentType === 'video/mp4';
          const ext = isVideo ? 'mp4' : (contentType === 'image/png' ? 'png' : 'jpg');
          // Shorten filename to avoid "Link Too Long" errors (subcode 2061013)
          const filename = `${Math.random().toString(36).substring(7)}_${Date.now()}.${ext}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(filename, bytes, { // Pass the Buffer directly
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
            
          // Use Raw Supabase URL for Meta (Photo/Feed) to avoid "Link Too Long" errors
          mediaUrl = publicUrlData.publicUrl;
          console.log(`Successfully uploaded media to Supabase: ${mediaUrl}`)
          
          // Wait 2000ms to allow Supabase global CDN to propagate
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
              imageUrl: mediaUrl,
              caption: `${content.hook}\n\n${content.caption}\n\n${content.cta}\n\n${content.hashtags}`,
              base64Image: rawBase64ForMeta,
              isVideo: isVideo
            })
            
            if (pubResult.id) {
              status = 'published'
              publishedAt = new Date().toISOString()
            } else {
              console.error('Facebook Publish Error:', pubResult)
              status = 'failed'
              const metaErr = pubResult.error?.message || pubResult.error?.error_user_msg || JSON.stringify(pubResult);
              throw new Error(`Facebook Publish Error: ${metaErr} (Debug: ${JSON.stringify(pubResult)})`)
            }
          } else if (account.platform === 'instagram') {
            console.log(`Publishing now to Instagram: ${account.platform_name}`)
            const pubResult = await metaService.publishToInstagram(account.access_token, account.platform_user_id, {
              imageUrl: mediaUrl,
              caption: `${content.hook}\n\n${content.caption}\n\n${content.cta}\n\n${content.hashtags}`,
              isVideo: isVideo
            })
            
            if (pubResult.id) {
              status = 'published'
              publishedAt = new Date().toISOString()
            } else {
              console.error('Instagram Publish Error:', pubResult)
              status = 'failed'
              const igErr = pubResult.error?.message || pubResult.error?.error_user_msg || JSON.stringify(pubResult);
              throw new Error(`Instagram Publish Error: ${igErr} (Debug: ${JSON.stringify(pubResult)})`)
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
            image_url: mediaUrl,
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
        console.timeEnd(`PostGeneration-${account.id}`);
      } catch (err: any) {
        console.error(`CRITICAL: Generation failed for ${account.platform}:`, err);
        generationErrors.push(`[${account.platform_name}] ${err.message || 'Internal logic error'}`);
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
