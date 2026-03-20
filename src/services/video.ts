import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as googleTTS from 'google-tts-api';

// Bind the lightweight Vercel-compatible FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export class VideoService {
    
    async compileShortVideo(imagesBase64: string[], script: string): Promise<string> {
        console.log("Initializing TikTok FFmpeg compiler...");
        const jobId = Math.random().toString(36).substring(7);
        const tmpDir = os.tmpdir();
        
        try {
            const audioPath = path.join(tmpDir, `aud_${jobId}.mp3`);
            const concatFilePath = path.join(tmpDir, `slides_${jobId}.txt`);
            const outputPath = path.join(tmpDir, `out_${jobId}.mp4`);
            
            // 1. Generate Voiceover via Google Translate free neural edge-API
            try {
                const audioChunks = await googleTTS.getAllAudioBase64(safeScript, {
                    lang: 'en',
                    slow: false,
                    host: 'https://translate.google.com',
                });
                const validChunks = audioChunks.filter(c => c && c.base64);
                if (validChunks.length === 0) throw new Error("Google AI voice engine check failed.");
                const fullAudioBuffer = Buffer.concat(validChunks.map(c => Buffer.from(c.base64, 'base64')));
                await fs.writeFile(audioPath, fullAudioBuffer);
                console.log("TTS Generation Success.");
            } catch (ttsErr: any) {
                console.warn("TTS Failed (likely Vercel IP block), falling back to silent video track...", ttsErr.message);
                // Create a 1-second silent MP3 as a fallback to prevent FFmpeg from crashing due to missing input
                const silentBuffer = Buffer.from('SUQzBAAAAAAAAFRTU0UAAAANAAADTGF2ZTU4LjkxLjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'base64');
                await fs.writeFile(audioPath, silentBuffer);
            }
            
            // 2. Save Images and Build FFmpeg Concat file
            let concatContent = '';
            // We give each image an exact 4 second slide duration
            const SLIDE_DURATION = 4;
            
            for (let i = 0; i < imagesBase64.length; i++) {
                let imageBuffer: Buffer;
                if (imagesBase64[i].startsWith('http')) {
                    const res = await fetch(imagesBase64[i]);
                    imageBuffer = Buffer.from(await res.arrayBuffer());
                } else {
                    const base64Data = imagesBase64[i].includes(',') ? imagesBase64[i].split(',')[1] : imagesBase64[i];
                    imageBuffer = Buffer.from(base64Data, 'base64');
                }
                const imagePath = path.join(tmpDir, `img_${jobId}_${i}.jpg`);
                await fs.writeFile(imagePath, imageBuffer);
                
                concatContent += `file '${imagePath}'\n`;
                concatContent += `duration ${SLIDE_DURATION}\n`;
            }
            // FFmpeg concat demuxer requirement: repeat the last file without a duration
            concatContent += `file '${path.join(tmpDir, `img_${jobId}_${imagesBase64.length - 1}.jpg`)}'\n`;
            await fs.writeFile(concatFilePath, concatContent);

            console.log("Executing Vercel FFmpeg UltraFast Render...");
            
            // 3. UltraFast FFmpeg Compilation
            await new Promise<void>((resolve, reject) => {
                ffmpeg()
                    .input(concatFilePath)
                    .inputOptions(['-f concat', '-safe 0'])
                    .input(audioPath)
                    .outputOptions([
                        '-c:v libx264',
                        '-preset ultrafast', // Required for 10s Serverless timeout
                        '-pix_fmt yuv420p',
                        // Convert 1:1 square SDXL image to 9:16 vertical TikTok resolution natively
                        // Lowering to 720p to stay under Vercel 10s timeout
                        '-vf', 'scale=-1:1280,crop=720:1280',
                        '-c:a aac',
                        '-shortest' // Force cut off the video the exact instant the voiceover finishes
                    ])
                    .save(outputPath)
                    .on('end', () => resolve())
                    .on('error', (err) => {
                        console.error('FFmpeg render failed:', err);
                        reject(new Error(`FFmpeg error: ${err.message}`));
                    });
            });

            console.log("Render complete! Serializing video for Vercel edge stream...");
            
            // 4. Return the fully rendered video as Binary Base64
            const videoBuffer = await fs.readFile(outputPath);
            
            // Cleanup Background Artifacts to free Vercel Edge RAM
            await Promise.all([
                fs.unlink(audioPath).catch(() => {}),
                fs.unlink(concatFilePath).catch(() => {}),
                fs.unlink(outputPath).catch(() => {}),
                ...imagesBase64.map((_, i) => fs.unlink(path.join(tmpDir, `img_${jobId}_${i}.jpg`)).catch(() => {}))
            ]);

            return `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
            
        } catch (error: any) {
            throw new Error(`Video Compiler Exception: ${error.message}`);
        }
    }
}

export const videoService = new VideoService();
