import { createClient } from '../../../../lib/supabase'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { aiService } from '../../../../services/ai'
import { NextResponse } from 'next/server'

// Media generation (Image + TTS + FFmpeg) needs its own 60s window
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { postId } = await request.json().catch(() => ({}));
    if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch the post and its metadata
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.status === 'published') return NextResponse.json({ error: 'Post already published' }, { status: 400 });

    const metadata = (post as any).metadata || {};
    const { videoScript, imageContext, isVideo } = metadata;

    if (!imageContext) throw new Error("Post metadata missing (imageContext)");

    // ── STEP 1: MEDIA GENERATION ──
    console.log(`[MediaGen] Starting ${isVideo ? 'VIDEO' : 'IMAGE'} generation for post ${postId}`);
    let mediaDataUri: string;
    let ttsStatus = 'n/a';

    try {
      if (isVideo && videoScript) {
        // Generate 1 image for the video
        console.log("[MediaGen] Generating base image for video...");
        const imageBase64 = await aiService.generateImage(
          `Context: ${imageContext}. Subject: ${videoScript.imagePrompts[0]}`,
          post.caption, 512, 896
        );
        // Compile video with FFmpeg
        console.log("[MediaGen] Compiling video with FFmpeg...");
        const { videoService } = await import('../../../../services/video');
        const videoResult = await videoService.compileShortVideo([imageBase64], videoScript.script);
        mediaDataUri = videoResult.videoDataUri;
        ttsStatus = videoResult.ttsStatus;
      } else {
        // Generate a single image
        console.log("[MediaGen] Generating single high-res image...");
        mediaDataUri = await aiService.generateImage(imageContext, post.caption, 1024, 1024);
      }
    } catch (genErr: any) {
      console.error("[MediaGen] Generation failed:", genErr.message);
      // Fallback to image if video fails
      if (isVideo) {
          console.log("[MediaGen] Falling back to image-only due to video failure.");
          mediaDataUri = await aiService.generateImage(imageContext, post.caption, 1024, 1024);
      } else {
          throw genErr;
      }
    }

    // ── STEP 2: UPLOAD TO STORAGE ──
    console.log("[MediaGen] Uploading to storage...");
    let bytes: Buffer;
    let contentType: string;

    if (mediaDataUri.startsWith('data:')) {
      contentType = mediaDataUri.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      bytes = Buffer.from(mediaDataUri.split(',')[1], 'base64');
    } else {
      const res = await fetch(mediaDataUri);
      bytes = Buffer.from(await res.arrayBuffer());
      contentType = res.headers.get('content-type') || 'image/jpeg';
    }

    let ext = 'jpg';
    if (contentType.includes('video')) ext = 'mp4';
    else if (contentType.includes('png')) ext = 'png';
    const filename = `media_${user.id}_${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('generated-images')
      .upload(filename, bytes, { contentType });
    
    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);
    
    const mediaUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;

    // ── STEP 3: UPDATE DB ──
    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        image_url: mediaUrl,
        status: 'media_ready',
        error_message: null
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      mediaUrl,
      ttsStatus
    });

  } catch (error: any) {
    console.error('[MediaGen] API 500:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
