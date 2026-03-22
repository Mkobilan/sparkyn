import { createClient } from '../../../../../lib/supabase'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'
import { videoService } from '../../../../../services/video'
import { NextResponse } from 'next/server'

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { postId } = await request.json().catch(() => ({}));
    if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch Post
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // 2. Parse Fallback Metadata
    const rawMeta = post.hashtags?.find((h: string) => h.startsWith('__METADATA__:'));
    const metadata = rawMeta ? JSON.parse(rawMeta.replace('__METADATA__:', '')) : {};
    const { isVideo, imageUrl, audioUrl } = metadata;

    if (!imageUrl) throw new Error("Metadata missing (imageUrl)");

    // ── STEP: FINAL COMPILATION ──
    console.log(`[Waterfall-Compile] Finalizing ${isVideo ? 'VIDEO' : 'IMAGE'} for post ${postId}`);

    if (isVideo) {
        // VIDEO COMPILATION: Offload to Dedicated Render Worker
        const workerUrl = process.env.RENDER_WORKER_URL || 'http://localhost:8080';
        const secretKey = process.env.API_SECRET_KEY || 'development_secret_key';

        console.log(`[Waterfall-Compile] Triggering async render worker at ${workerUrl}...`);
        
        // Fire request to worker and wait for 202 Accepted.
        // Worker will compile in background and update the DB to 'media_ready'
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500);

        try {
            const workerRes = await fetch(`${workerUrl}/compile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    postId,
                    userId: user.id,
                    imageUrl,
                    audioUrl,
                    secretKey
                })
            });

            clearTimeout(timeoutId);
            
            if (!workerRes.ok) {
                const errBody = await workerRes.text();
                throw new Error(`Worker HTTP ${workerRes.status}: ${errBody}`);
            }
        } catch (workerErr: any) {
            clearTimeout(timeoutId);
            if (workerErr.name === 'AbortError') {
                console.warn("[Waterfall-Compile] Render worker response took > 8s. Node Event loop is likely CPU-starved or cold booting. Optmistically polling.");
                // Optimistic Return: The proxy buffers the request. We assume Render will process it soon!
                return NextResponse.json({ 
                    success: true, 
                    status: 'processing',
                    message: 'Video queued successfully (CPU delayed). Please poll for media_ready.' 
                }, { status: 202 });
            }
            throw workerErr;
        }

        // Return 202 Processing so frontend knows to poll the database
        return NextResponse.json({ 
            success: true, 
            status: 'processing',
            message: 'Video compilation has started. Please poll for media_ready.' 
        }, { status: 202 });

    } else {
        // IMAGE ONLY: Immediate Upload
        let finalMediaDataUri = imageUrl;

        console.log("[Waterfall-Compile] Uploading final image...");
        let bytes: Buffer;
        let contentType: string;

        if (finalMediaDataUri.startsWith('data:')) {
          contentType = finalMediaDataUri.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
          bytes = Buffer.from(finalMediaDataUri.split(',')[1], 'base64');
        } else {
          const res = await fetch(finalMediaDataUri);
          bytes = Buffer.from(await res.arrayBuffer());
          contentType = res.headers.get('content-type') || 'image/jpeg';
        }

        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        const filename = `final_${user.id}_${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabaseAdmin.storage
          .from('generated-images')
          .upload(filename, bytes, { contentType });
        
        if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);
        const finalUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;

        // Strip metadata from hashtags on final stage
        const cleanHashtags = (post.hashtags || []).filter((h: string) => !h.startsWith('__METADATA__:'));

        const { error: updateError } = await supabase
          .from('scheduled_posts')
          .update({
            image_url: finalUrl,
            hashtags: cleanHashtags.length > 0 ? cleanHashtags : null,
            status: 'media_ready',
            error_message: null
          })
          .eq('id', postId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, mediaUrl: finalUrl, status: 'media_ready' });
    }

  } catch (error: any) {
    console.error('[Waterfall-Compile] Error:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
