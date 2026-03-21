
import { createClient } from '../../../../../lib/supabase'
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
    const { videoScript, imageContext, isVideo } = metadata;

    if (!imageContext) throw new Error("Metadata missing (imageContext)");

    // ── STEP: AI IMAGE GENERATION ──
    console.log(`[Waterfall-Image] Generating image for post ${postId}`);
    const subject = isVideo && videoScript ? videoScript.imagePrompts[0] : post.caption;
    const prompt = isVideo ? `Context: ${imageContext}. Subject: ${subject}` : imageContext;
    
    // Generate image (This is the heavy part)
    const mediaDataUri = await aiService.generateImage(
      prompt, 
      post.caption, 
      isVideo ? 512 : 1024, 
      isVideo ? 896 : 1024
    );

    // ── UPDATE METADATA ──
    metadata.imageBase64 = mediaDataUri;
    const updatedMeta = `__METADATA__:${JSON.stringify(metadata)}`;
    const updatedHashtags = (post.hashtags || []).map((h: string) => h.startsWith('__METADATA__:') ? updatedMeta : h);

    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        hashtags: updatedHashtags,
        status: 'image_ready'
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, status: 'image_ready' });

  } catch (error: any) {
    console.error('[Waterfall-Image] Error:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
