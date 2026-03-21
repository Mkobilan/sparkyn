import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

// Allow both POST (from GitHub Actions) and GET (from self-trigger)
export async function POST(request: Request) {
  return handleCron(request);
}
export async function GET(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  // 1. Verify Authorization
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[Cron] Auth failed. Got:', authHeader?.slice(0, 20), '...');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = [];

  try {
    const { aiService } = await import('@/services/ai');
    const { videoService } = await import('@/services/video');
    const { metaService } = await import('@/services/social/meta');
    const { youtubeService } = await import('@/services/social/youtube');
    const { tiktokService } = await import('@/services/social/tiktok');

    // ── STAGE 1: SCRIPT GEN (FALLBACK FROM 'scheduled' IF NEEDED) ──
    // This is handled by api/generate usually, but we keep it here for robustness
    const { data: scriptPending } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, social_accounts!platform_account_id(*), profiles!user_id(*)')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date(Date.now() + 600000).toISOString()) // Within 10 mins
      .limit(3);

    for (const post of (scriptPending || [])) {
       // Logic to trigger Step 1 if skipped... 
       // For now, we assume Step 1 is done by the dashboard or a separate trigger.
    }

    // ── STAGE 2: IMAGE GENERATION (status: 'content_ready') ──
    const { data: imagePending } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, social_accounts!platform_account_id(*), profiles!user_id(*)')
      .eq('status', 'content_ready')
      .limit(2);

    for (const post of (imagePending || [])) {
        try {
            const rawMeta = post.hashtags?.find((h: string) => h.startsWith('__METADATA__:'));
            const metadata = rawMeta ? JSON.parse(rawMeta.replace('__METADATA__:', '')) : {};
            const { imageContext, videoScript, isVideo } = metadata;
            const subject = isVideo && videoScript ? videoScript.imagePrompts[0] : post.caption;
            const prompt = isVideo ? `Context: ${imageContext}. Subject: ${subject}` : imageContext;

            const mediaDataUri = await aiService.generateImage(prompt, post.caption, isVideo ? 512 : 1024, isVideo ? 896 : 1024);
            
            // Upload to storage immediately to prevent base64 corruption
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

            const ext = contentType.includes('png') ? 'png' : 'jpg';
            const filename = `cron_inter_${post.id}_${Date.now()}.${ext}`;
            await supabaseAdmin.storage.from('generated-images').upload(filename, bytes, { contentType });
            metadata.imageUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;
            delete metadata.imageBase64;

            const updatedMeta = `__METADATA__:${JSON.stringify(metadata)}`;
            const updatedHashtags = (post.hashtags || []).map((h: string) => h.startsWith('__METADATA__:') ? updatedMeta : h);

            await supabaseAdmin.from('scheduled_posts').update({ hashtags: updatedHashtags, status: 'image_ready' }).eq('id', post.id);
            results.push(`${post.id}: image_ready`);
        } catch (e: any) {
            console.error(`[Cron Image] Error for ${post.id}:`, e.message);
            await supabaseAdmin.from('scheduled_posts').update({ status: 'failed', error_message: `Image Gen Failure: ${e.message}` }).eq('id', post.id);
        }
    }

    // ── STAGE 3: AUDIO GENERATION (status: 'image_ready') ──
    const { data: audioPending } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'image_ready')
      .limit(3);

    for (const post of (audioPending || [])) {
        try {
            const rawMeta = post.hashtags?.find((h: string) => h.startsWith('__METADATA__:'));
            const metadata = rawMeta ? JSON.parse(rawMeta.replace('__METADATA__:', '')) : {};
            if (!metadata.isVideo) {
                await supabaseAdmin.from('scheduled_posts').update({ status: 'audio_ready' }).eq('id', post.id);
                results.push(`${post.id}: audio_ready (skipped)`);
                continue;
            }

            // Simple Google TTS Fallback for Cron (fast & reliable)
            const googleTTS = await import('google-tts-api');
            const safeScript = metadata.videoScript.script.slice(0, 100);
            const audioChunks = await googleTTS.getAllAudioBase64(safeScript, { lang: 'en', slow: false, host: 'https://translate.google.com' });
            const audioBuffer = Buffer.concat(audioChunks.filter(c => c && c.base64).map(c => Buffer.from(c.base64, 'base64')));
            
            const filename = `cron_aud_${post.id}_${Date.now()}.mp3`;
            await supabaseAdmin.storage.from('generated-images').upload(filename, audioBuffer, { contentType: 'audio/mpeg' });
            metadata.audioUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;

            const updatedMeta = `__METADATA__:${JSON.stringify(metadata)}`;
            const updatedHashtags = (post.hashtags || []).map((h: string) => h.startsWith('__METADATA__:') ? updatedMeta : h);
            await supabaseAdmin.from('scheduled_posts').update({ hashtags: updatedHashtags, status: 'audio_ready' }).eq('id', post.id);
            results.push(`${post.id}: audio_ready`);
        } catch (e: any) {
            console.error(`[Cron Audio] Error for ${post.id}:`, e.message);
            await supabaseAdmin.from('scheduled_posts').update({ status: 'failed', error_message: `Audio Gen Failure: ${e.message}` }).eq('id', post.id);
        }
    }

    // ── STAGE 4: COMPILATION (status: 'audio_ready') ──
    const { data: compilePending } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'audio_ready')
      .limit(1); // Compilation is heavy, do 1 at a time in cron

    for (const post of (compilePending || [])) {
        try {
            const rawMeta = post.hashtags?.find((h: string) => h.startsWith('__METADATA__:'));
            const metadata = rawMeta ? JSON.parse(rawMeta.replace('__METADATA__:', '')) : {};
            const { isVideo, imageUrl, audioUrl } = metadata;
            
            let finalUrl = '';
            if (isVideo && audioUrl) {
                // compileShortVideoFromAssets handles URLs automatically
                const res = await videoService.compileShortVideoFromAssets([imageUrl], audioUrl);
                const bytes = Buffer.from(res.videoDataUri.split(',')[1], 'base64');
                const filename = `cron_vid_${post.id}_${Date.now()}.mp4`;
                await supabaseAdmin.storage.from('generated-images').upload(filename, bytes, { contentType: 'video/mp4' });
                finalUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;
            } else {
                finalUrl = imageUrl;
            }

            const cleanHashtags = (post.hashtags || []).filter((h: string) => !h.startsWith('__METADATA__:'));
            await supabaseAdmin.from('scheduled_posts').update({ image_url: finalUrl, hashtags: cleanHashtags, status: 'media_ready' }).eq('id', post.id);
            results.push(`${post.id}: media_ready`);
        } catch (e: any) {
            console.error(`[Cron Compile] Error for ${post.id}:`, e.message);
            await supabaseAdmin.from('scheduled_posts').update({ status: 'failed', error_message: `Compilation Failure: ${e.message}` }).eq('id', post.id);
        }
    }

    // ── STAGE 5: PUBLISHING (status: 'media_ready') ──
    const { data: publishPending } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, social_accounts!platform_account_id(*)')
      .eq('status', 'media_ready')
      .lte('scheduled_at', new Date().toISOString())
      .limit(5);

    for (const post of (publishPending || [])) {
        try {
            const account = post.social_accounts;
            if (!account) throw new Error("No account linked");

            let currentAccessToken = account.access_token;
            // Token Refresh logic (YouTube)
            if (account.platform === 'youtube' && account.refresh_token && (!account.expires_at || new Date(account.expires_at).getTime() < Date.now() + 300000)) {
                const creds = await youtubeService.refreshAccessToken(account.refresh_token);
                currentAccessToken = creds.access_token;
                await supabaseAdmin.from('social_accounts').update({ access_token: creds.access_token, expires_at: new Date(creds.expiry_date || Date.now() + 3600000).toISOString() }).eq('id', account.id);
            }

            const pubCaption = `${post.hook || ''}\n\n${post.caption}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`.trim();
            const isVideo = post.image_url?.includes('.mp4');
            let pubResult: any;

            if (account.platform === 'facebook') pubResult = await metaService.publishToFacebook(currentAccessToken, account.platform_user_id, { imageUrl: post.image_url, caption: pubCaption, isVideo });
            else if (account.platform === 'instagram') pubResult = await metaService.publishToInstagram(currentAccessToken, account.platform_user_id, { imageUrl: post.image_url, caption: pubCaption, isVideo });
            else if (account.platform === 'youtube') pubResult = await youtubeService.publishShort(currentAccessToken, { videoUrl: post.image_url, title: post.hook || 'Short', description: post.caption });
            else if (account.platform === 'tiktok') pubResult = await tiktokService.publishVideo(currentAccessToken, { videoUrl: post.image_url, caption: post.caption });

            if (pubResult?.id || pubResult?.data?.id) {
                await supabaseAdmin.from('scheduled_posts').update({ status: 'published', published_at: new Date().toISOString(), platform_post_id: pubResult.id || pubResult.data.id }).eq('id', post.id);
                results.push(`${post.id}: published`);
            } else throw new Error(JSON.stringify(pubResult?.error || pubResult || "Unknown error"));
        } catch (e: any) {
            console.error(`[Cron Publish] Error for ${post.id}:`, e.message);
            await supabaseAdmin.from('scheduled_posts').update({ status: 'failed', error_message: `Publish Failure: ${e.message}` }).eq('id', post.id);
        }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('[Cron] Fatal:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
