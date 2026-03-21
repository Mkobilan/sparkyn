import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // 1. Verify Authorization
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // --- STAGE 1: MEDIA GENERATION ---
    // Fetch 1 post that's scheduled but still has the placeholder media
    const { data: mediaPending, error: mediaErr } = await supabase
      .from('scheduled_posts')
      .select('*, social_accounts(*), profiles(*)')
      .eq('status', 'scheduled')
      .eq('image_url', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1080&auto=format&fit=crop')
      .limit(1);

    if (mediaPending && mediaPending.length > 0) {
        const post = mediaPending[0];
        try {
            console.log(`[Cron Stage 1] Generating media for post ${post.id}`);
            const account = post.social_accounts;
            const profile = post.profiles;
            // Check the URL for the type flag OR the platform default
            const isVideo = post.image_url.includes('type=video') || ['tiktok', 'instagramreels', 'youtube'].includes(account.platform);
            
            const imageContext = `${account?.metadata?.industry || profile?.industry} business - ${account?.metadata?.description || profile?.business_description}`;
            const { aiService } = await import('@/services/ai');
            
            let finalMediaUrl = '';
            if (isVideo) {
                const { script, imagePrompts } = await aiService.generateShortVideoScript(imageContext, post.caption);
                const imageBase64 = await aiService.generateImage(`Context: ${imageContext}. Subject: ${imagePrompts[0]}`, post.caption, 512, 896);
                const { videoService } = await import('@/services/video');
                const result = await videoService.compileShortVideo([imageBase64], script);
                finalMediaUrl = result.videoDataUri;
            } else {
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
            await supabase.storage.from('generated-images').upload(filename, bytes, { contentType: contentType });
            const publicUrl = supabase.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;
            
            await supabase.from('scheduled_posts').update({ 
                image_url: publicUrl,
                status: 'media_ready' 
            }).eq('id', post.id);
            console.log(`[Cron Stage 1] Media ready for ${post.id}`);
        } catch (err: any) {
            console.error(`[Cron Stage 1] Failed for ${post.id}:`, err.message);
            // Don't mark as failed here, let it retry or handle eventually
        }
        return NextResponse.json({ success: true, stage: 1 });
    }

    // --- STAGE 2: PUBLISHING ---
    // Fetch 1 post that has media ready and whose scheduled time has passed
    const { data: publishPending, error: pubErr } = await supabase
      .from('scheduled_posts')
      .select('*, social_accounts(*)')
      .eq('status', 'media_ready')
      .lte('scheduled_at', new Date().toISOString())
      .limit(1);

    if (publishPending && publishPending.length > 0) {
        const post = publishPending[0];
        try {
            console.log(`[Cron Stage 2] Publishing post ${post.id} to ${post.social_accounts.platform}`);
            const account = post.social_accounts;
            const isVideo = account.platform === 'tiktok' || account.platform === 'instagramreels' || account.platform === 'youtube';
            
            const { metaService } = await import('@/services/social/meta');
            const { youtubeService } = await import('@/services/social/youtube');
            const { tiktokService } = await import('@/services/social/tiktok');

            const pubParams = {
                imageUrl: post.image_url,
                caption: `${post.hook || ''}\n\n${post.caption}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`,
                isVideo: isVideo
            };

            let pubResult: any;
            if (account.platform === 'facebook') {
                pubResult = await metaService.publishToFacebook(account.access_token, account.platform_user_id, pubParams);
            } else if (account.platform === 'instagram') {
                pubResult = await metaService.publishToInstagram(account.access_token, account.platform_user_id, pubParams);
            } else if (account.platform === 'youtube') {
                pubResult = await youtubeService.publishShort(account.access_token, { 
                    videoUrl: post.image_url, 
                    title: post.hook || 'New Short', 
                    description: post.caption 
                });
            } else if (account.platform === 'tiktok') {
                pubResult = await tiktokService.publishVideo(account.access_token, { 
                    videoUrl: post.image_url, 
                    caption: post.caption 
                });
            }

            if (pubResult.id || pubResult.data?.id) {
                await supabase.from('scheduled_posts').update({ 
                    status: 'published',
                    published_at: new Date().toISOString(),
                    platform_post_id: pubResult.id || pubResult.data?.id
                }).eq('id', post.id);
                console.log(`[Cron Stage 2] Post ${post.id} published!`);
            } else {
                const errorMsg = pubResult.error?.message || JSON.stringify(pubResult.error || pubResult);
                throw new Error(errorMsg);
            }
        } catch (err: any) {
            console.error(`[Cron Stage 2] Failed for ${post.id}:`, err.message);
            await supabase.from('scheduled_posts').update({ status: 'failed' }).eq('id', post.id);
        }
        return NextResponse.json({ success: true, stage: 2 });
    }

    return NextResponse.json({ success: true, message: 'Idle' });
  } catch (error: any) {
    console.error('Cron fatal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
