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

    // 1. Fetch posts scheduled for the future that are missing media (placeholder or null)
    const { data: pendingPosts, error: fetchErr } = await supabase
      .from('scheduled_posts')
      .select('*, social_accounts(*), profiles(*)')
      .eq('status', 'scheduled')
      .or('image_url.is.null,image_url.eq.https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1080&auto=format&fit=crop')
      .limit(2); // Process 2 at a time to stay under 10s (roughly 4s per post)

    if (fetchErr) throw fetchErr;

    for (const post of (pendingPosts || [])) {
      try {
        console.log(`Generating media for deferred post: ${post.id}`);
        const account = post.social_accounts;
        const profile = post.profiles;
        const isVideo = post.platforms.some((p: string) => ['tiktok', 'instagramreels', 'youtube'].includes(p));
        
        const imageContext = `${account?.metadata?.industry || profile?.industry} business - ${account?.metadata?.description || profile?.business_description}`;
        const contentContext = post.caption;

        const { aiService } = await import('@/services/ai');
        let mediaUrl = '';

        if (isVideo) {
          const { script, imagePrompts } = await aiService.generateShortVideoScript(imageContext, contentContext);
          // 1 Image Mode for Hobby Speed
          const imageBase64 = await aiService.generateImage(`Context: ${imageContext}. Subject: ${imagePrompts[0]}`, contentContext, 512, 896);
          const { videoService } = await import('@/services/video');
          const videoResult = await videoService.compileShortVideo([imageBase64], script);
          mediaUrl = videoResult.videoDataUri;
        } else {
          mediaUrl = await aiService.generateImage(imageContext, contentContext, 1024, 1024);
        }

        // Upload to Supabase Storage
        let bytes: Buffer;
        let contentType: string;
        if (mediaUrl.startsWith('data:')) {
          contentType = mediaUrl.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
          bytes = Buffer.from(mediaUrl.split(',')[1], 'base64');
        } else {
          const res = await fetch(mediaUrl);
          bytes = Buffer.from(await res.arrayBuffer());
          contentType = res.headers.get('content-type') || 'image/jpeg';
        }

        const ext = contentType.includes('video') ? 'mp4' : 'jpg';
        const filename = `cron_${post.id}_${Date.now()}.${ext}`;
        await supabase.storage.from('generated-images').upload(filename, bytes, { contentType });
        const finalUrl = supabase.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;

        await supabase.from('scheduled_posts').update({ image_url: finalUrl }).eq('id', post.id);
        console.log(`Media updated for post ${post.id}`);

      } catch (err: any) {
        console.error(`Post ${post.id} generation failed:`, err.message);
        // We'll retry on next cron run
      }
    }

    // 2. Publish logic for posts whose time has come
    // ... (could be added here or in a separate step) ...

    return NextResponse.json({ success: true, processed: pendingPosts?.length || 0 })
  } catch (error: any) {
    console.error('Cron processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
