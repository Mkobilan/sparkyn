
import { createClient } from '../../../../../lib/supabase'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'
import { videoService } from '../../../../../services/video'
import { aiService } from '../../../../../services/ai'
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
    let finalMediaDataUri: string;

    if (isVideo && audioUrl) {
        const videoResult = await videoService.compileShortVideoFromAssets([imageUrl], audioUrl);
        finalMediaDataUri = videoResult.videoDataUri;
    } else {
        finalMediaDataUri = imageUrl; // It's already a URL, so we can pass it to the uploader
    }

    // ── UPLOAD TO STORAGE ──
    console.log("[Waterfall-Compile] Uploading final media...");
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
    if (contentType.includes('video')) ext = 'mp4';
    else if (contentType.includes('png')) ext = 'png';
    const filename = `final_${user.id}_${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('generated-images')
      .upload(filename, bytes, { contentType });
    
    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);
    const finalUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;

    // ── UPDATE DB ──
    // Strip metadata from hashtags on final stage
    const cleanHashtags = (post.hashtags || []).filter((h: string) => !h.startsWith('__METADATA__:'));

    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        image_url: finalUrl,
        hashtags: cleanHashtags,
        status: 'media_ready',
        error_message: null
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, mediaUrl: finalUrl, status: 'media_ready' });

  } catch (error: any) {
    console.error('[Waterfall-Compile] Error:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
