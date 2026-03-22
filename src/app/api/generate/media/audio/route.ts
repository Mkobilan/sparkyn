
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
    
    // Clean script for TTS
    const safeScript = videoScript.script
        .replace(/[^\x20-\x7E]/g, "") // Remove non-ASCII
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 250);

    let audioBuffer: Buffer | null = null;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (elevenLabsKey) {
        try {
            console.log(`[Waterfall-Audio] Attempting ElevenLabs...`);
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgH9P3Od9pJC`, {
                method: 'POST',
                headers: { 'xi-api-key': elevenLabsKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: safeScript, 
                    model_id: "eleven_multilingual_v2", // Better quality
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                })
            });
            if (res.ok) {
                audioBuffer = Buffer.from(await res.arrayBuffer());
                console.log(`[Waterfall-Audio] ElevenLabs Success: ${audioBuffer.length} bytes`);
            } else {
                console.warn(`[Waterfall-Audio] ElevenLabs API error: ${res.status}`);
            }
        } catch (e) {
            console.warn("[Waterfall-Audio] ElevenLabs Exception:", e);
        }
    }

    // Fallback to Google TTS if ElevenLabs fails
    if (!audioBuffer || audioBuffer.length < 100) {
        try {
            console.log(`[Waterfall-Audio] Falling back to Google TTS...`);
            const googleTTS = await import('google-tts-api');
            const ttsText = safeScript.length > 200 ? safeScript.slice(0, 200) : safeScript;
            
            // Do NOT use getAllAudioBase64. Concatenating MP3 buffers directly creates malformed 
            // ID3 streams that completely lock up FFmpeg in the worker.
            const base64Audio = await googleTTS.getAudioBase64(ttsText, {
                lang: 'en',
                slow: false,
                host: 'https://translate.google.com',
            });
            
            if (base64Audio) {
                audioBuffer = Buffer.from(base64Audio, 'base64');
                console.log(`[Waterfall-Audio] Google TTS Success: ${audioBuffer.length} bytes`);
            }
        } catch (e) {
            console.error("[Waterfall-Audio] Google TTS Exception:", e);
        }
    }

    if (!audioBuffer || audioBuffer.length < 500) {
        throw new Error("Audio generation failed: All TTS providers failed or returned empty data.");
    }

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
