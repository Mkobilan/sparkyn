import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as googleTTS from 'google-tts-api';

// Bind the lightweight Vercel-compatible FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

interface VideoResult {
    videoDataUri: string;
    ttsStatus: string;
}

export class VideoService {
    
    async compileShortVideo(imagesBase64: string[], script: string): Promise<VideoResult> {
        console.log("Initializing Video FFmpeg compiler...");
        const jobId = Math.random().toString(36).substring(7);
        const tmpDir = os.tmpdir();
        let ttsStatus = 'not_attempted';
        
        try {
            const audioPath = path.join(tmpDir, `aud_${jobId}.mp3`);
            const outputPath = path.join(tmpDir, `out_${jobId}.mp4`);
            
            // 1. Generate Voiceover — try ElevenLabs → Google TTS → Silent fallback
            // Keep script short and ASCII-safe for TTS compatibility
            const safeScript = script
                .replace(/[^\x20-\x7E]/g, "")  // ASCII printable only
                .replace(/\s+/g, " ")           // Collapse whitespace
                .trim()
                .slice(0, 200)                  // Cap length for TTS
                || "Enjoy the video.";
            
            const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
            let ttsSucceeded = false;

            // Attempt 1: ElevenLabs (if key exists)
            if (elevenLabsKey) {
                try {
                    console.log("Attempting ElevenLabs TTS (3s timeout)...");
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);

                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgH9P3Od9pJC`, {
                        method: 'POST',
                        headers: {
                            'xi-api-key': elevenLabsKey,
                            'Content-Type': 'application/json',
                        },
                        signal: controller.signal,
                        body: JSON.stringify({
                            text: safeScript,
                            model_id: "eleven_monolingual_v1",
                            voice_settings: { stability: 0.5, similarity_boost: 0.5 }
                        })
                    });
                    
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const errText = await response.text();
                        throw new Error(`ElevenLabs ${response.status}: ${errText.slice(0, 100)}`);
                    }

                    const audioBuffer = await response.arrayBuffer();
                    if (audioBuffer.byteLength < 500) throw new Error("ElevenLabs returned empty audio");
                    await fs.writeFile(audioPath, Buffer.from(audioBuffer));
                    ttsSucceeded = true;
                    ttsStatus = 'elevenlabs_success';
                    console.log(`ElevenLabs TTS Success: ${audioBuffer.byteLength} bytes`);
                } catch (e: any) {
                    const isTimeout = e.name === 'AbortError';
                    console.warn(isTimeout ? "ElevenLabs timed out after 3s." : "ElevenLabs failed:", e.message);
                    ttsStatus = `elevenlabs_failed: ${isTimeout ? 'timeout' : e.message.slice(0, 80)}`;
                }
            }

            // Attempt 2: Google TTS (free, no API key needed)
            if (!ttsSucceeded) {
                try {
                    console.log("Attempting Google TTS...");
                    // Use a short clean sentence to maximize reliability
                    const ttsText = safeScript.length > 100 ? safeScript.slice(0, 100) + '.' : safeScript;
                    const audioChunks = await googleTTS.getAllAudioBase64(ttsText, {
                        lang: 'en',
                        slow: false,
                        host: 'https://translate.google.com',
                    });
                    const validChunks = audioChunks.filter(c => c && c.base64 && c.base64.length > 10);
                    if (validChunks.length === 0) throw new Error("No valid audio chunks returned");
                    
                    const fullAudioBuffer = Buffer.concat(validChunks.map(c => Buffer.from(c.base64, 'base64')));
                    if (fullAudioBuffer.length < 500) throw new Error(`Audio too small: ${fullAudioBuffer.length} bytes`);
                    
                    await fs.writeFile(audioPath, fullAudioBuffer);
                    ttsSucceeded = true;
                    ttsStatus = `google_tts_success: ${fullAudioBuffer.length} bytes`;
                    console.log(`Google TTS Success: ${fullAudioBuffer.length} bytes`);
                } catch (e: any) {
                    console.warn("Google TTS failed:", e.message);
                    ttsStatus = `all_tts_failed: ${e.message.slice(0, 80)}`;
                }
            }

            // Attempt 3: Generate proper silent audio via FFmpeg (guarantees valid audio track)
            if (!ttsSucceeded) {
                console.log("All TTS failed. Generating silent audio track...");
                await new Promise<void>((resolve, reject) => {
                    ffmpeg()
                        .input('anullsrc=r=44100:cl=stereo')
                        .inputFormat('lavfi')
                        .outputOptions(['-t', '15', '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100'])
                        .save(audioPath)
                        .on('end', () => { console.log("Silent track generated."); resolve(); })
                        .on('error', (err) => { console.error("Silent gen failed:", err); reject(err); });
                });
                ttsStatus = ttsStatus || 'silent_fallback';
            }
            
            // 2. Save Images to disk
            const numImages = imagesBase64.length;
            for (let i = 0; i < numImages; i++) {
                let imageBuffer: Buffer;
                if (imagesBase64[i].startsWith('http')) {
                    const res = await fetch(imagesBase64[i]);
                    imageBuffer = Buffer.from(await res.arrayBuffer());
                } else {
                    const base64Data = imagesBase64[i].includes(',') ? imagesBase64[i].split(',')[1] : imagesBase64[i];
                    imageBuffer = Buffer.from(base64Data, 'base64');
                }
                await fs.writeFile(path.join(tmpDir, `img_${jobId}_${i}.jpg`), imageBuffer);
            }

            console.log(`Rendering ${numImages} images into 15s video...`);
            
            // 3. FFmpeg Render — dynamic filter complex
            const audioInputIndex = numImages;
            
            // Each image loops for enough frames to fill its share of 15 seconds
            const framesPerImage = Math.ceil(15 / numImages * 30); // at 30fps
            const videoFilters = imagesBase64.map((_, i) => 
                `[${i}:v]format=pix_fmts=yuv420p,setsar=1,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,loop=loop=${framesPerImage}:size=1:start=0[v${i}]`
            );
            videoFilters.push(`${imagesBase64.map((_, i) => `[v${i}]`).join('')}concat=n=${numImages}:v=1:a=0[outv]`);

            await new Promise<void>((resolve, reject) => {
                const ff = ffmpeg();
                for (let i = 0; i < numImages; i++) {
                    ff.input(path.join(tmpDir, `img_${jobId}_${i}.jpg`));
                }
                ff.input(audioPath);
                
                ff.outputOptions([
                    '-filter_complex', videoFilters.join(';'),
                    '-map', '[outv]',
                    '-map', `${audioInputIndex}:a`,
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast',
                    '-profile:v', 'high',
                    '-level', '4.1',
                    '-crf', '23',            // Slightly lower quality = smaller file = faster
                    '-pix_fmt', 'yuv420p',
                    '-r', '30',
                    '-g', '60',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-ar', '44100',
                    '-ac', '2',
                    '-movflags', '+faststart',
                    '-shortest',
                    '-t', '15',              // 15-second Short
                ])
                .save(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => {
                    console.error('FFmpeg render failed:', err);
                    reject(new Error(`FFmpeg error: ${err.message}`));
                });
            });

            // 4. Read and return video
            const videoBuffer = await fs.readFile(outputPath);
            const stats = await fs.stat(outputPath);
            console.log(`Render complete! Video: ${stats.size} bytes, TTS: ${ttsStatus}`);

            if (stats.size < 1000) {
                throw new Error("Generated video file is empty or too small.");
            }
            
            // Cleanup temp files
            await Promise.all([
                fs.unlink(audioPath).catch(() => {}),
                fs.unlink(outputPath).catch(() => {}),
                ...imagesBase64.map((_, i) => fs.unlink(path.join(tmpDir, `img_${jobId}_${i}.jpg`)).catch(() => {}))
            ]);

            return {
                videoDataUri: `data:video/mp4;base64,${videoBuffer.toString('base64')}`,
                ttsStatus,
            };
            
        } catch (error: any) {
            throw new Error(`Video Compiler Exception (TTS: ${ttsStatus}): ${error.message}`);
        }
    }
}

export const videoService = new VideoService();
