
import { createClient } from '../../../../../lib/supabase'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'
import { videoService } from '../../../../../services/video'
import { NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

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
    const { videoScript, isVideo } = metadata;

    if (!isVideo || !videoScript) {
        // Not a video, skip audio step
        return NextResponse.json({ success: true, skipped: true, status: 'audio_ready' });
    }

    // ── STEP: TTS AUDIO GENERATION ──
    console.log(`[Waterfall-Audio] Generating audio for post ${postId}`);
    
    // We'll use a temporary file to store audio before uploading to Supabase
    const tmpDir = os.tmpdir();
    const jobId = Math.random().toString(36).substring(7);
    const audioPath = path.join(tmpDir, `final_aud_${jobId}.mp3`);

    // Refactor: We need a way to just get the audio instead of full compilation.
    // For now, I'll borrow the TTS logic from VideoService.
    // Better: I'll create a standalone TTS service in services/ai.ts or similar.
    
    // Implementation: Since I can't easily refactor services right now, I'll use a hack:
    // I'll call a special "pre-process" method in VideoService or just re-implement here.
    // Let's re-implement the TTS part specifically for this route.

    const safeScript = videoScript.script
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200) || "Enjoy the video.";

    // Simple ElevenLabs Fetch
    let audioBuffer: Buffer | null = null;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (elevenLabsKey) {
        try {
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgH9P3Od9pJC`, {
                method: 'POST',
                headers: { 'xi-api-key': elevenLabsKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: safeScript, 
                    model_id: "eleven_monolingual_v1",
                    voice_settings: { stability: 0.5, similarity_boost: 0.5 }
                })
            });
            if (res.ok) audioBuffer = Buffer.from(await res.arrayBuffer());
        } catch (e) {
            console.warn("[AudioRoute] ElevenLabs Failed:", e);
        }
    }

    // Fallback to Google TTS if ElevenLabs fails
    if (!audioBuffer) {
        const googleTTS = await import('google-tts-api');
        const audioChunks = await googleTTS.getAllAudioBase64(safeScript.slice(0, 100), {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
        });
        const validChunks = audioChunks.filter(c => c && c.base64 && c.base64.length > 10);
        audioBuffer = Buffer.concat(validChunks.map(c => Buffer.from(c.base64, 'base64')));
    }

    if (!audioBuffer || audioBuffer.length < 500) throw new Error("Audio generation failed (empty buffer)");

    // Upload to Supabase Storage
    const filename = `audio_${user.id}_${Date.now()}.mp3`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('generated-images')
      .upload(filename, audioBuffer, { contentType: 'audio/mpeg' });
    
    if (uploadErr) throw new Error(`Audio upload failed: ${uploadErr.message}`);
    const audioUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;

    // ── UPDATE METADATA ──
    metadata.audioUrl = audioUrl;
    const updatedMeta = `__METADATA__:${JSON.stringify(metadata)}`;
    const updatedHashtags = (post.hashtags || []).map((h: string) => h.startsWith('__METADATA__:') ? updatedMeta : h);

    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        hashtags: updatedHashtags,
        status: 'audio_ready'
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, audioUrl, status: 'audio_ready' });

  } catch (error: any) {
    console.error('[Waterfall-Audio] Error:', error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
