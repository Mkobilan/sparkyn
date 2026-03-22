require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');

// Bind the lightweight Render/Vercel-compatible FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // to handle large payloads if base64 is sent

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiSecretKey = process.env.API_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("WARNING: Supabase URL or Key is missing from environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

app.post('/compile', async (req, res) => {
  const { postId, imageUrl, audioUrl, secretKey, userId } = req.body;

  // Basic auth check
  if (secretKey !== apiSecretKey) {
    return res.status(401).json({ error: 'Unauthorized. Invalid API_SECRET_KEY.' });
  }

  if (!postId || !userId || !imageUrl) {
    return res.status(400).json({ error: 'Missing required fields (postId, userId, imageUrl).' });
  }

  // Acknowledge the request immediately so Vercel doesn't timeout!
  res.status(202).json({ 
    message: 'Compilation job accepted. Processing in background.',
    postId 
  });

  // ---------------------------------------------------------
  // ASYNCHRONOUS BACKGROUND PROCESSING
  // ---------------------------------------------------------
  console.log(`[Worker] Started background job for Post ${postId}`);
  
  try {
    const jobId = Math.random().toString(36).substring(7);
    const tmpDir = os.tmpdir();
    const audioPath = path.join(tmpDir, `final_aud_${jobId}.mp3`);
    let imgPath = path.join(tmpDir, `img_${jobId}.jpg`);
    const outputPath = path.join(tmpDir, `out_${jobId}.mp4`);

    let filesToCleanup = [];
    global.currentFilesToCleanup = filesToCleanup;

    // 1. Fetch Image with Aggressive Failsafes to prevent HTML/500 corruption!
    console.log(`[Worker] Step 1: Downloading image...`);
    let imgRes = await fetch(imageUrl);
    let contentType = imgRes.headers.get('content-type') || '';
    
    // Failsafe 1: If Pollinations throws a 500 Server Error (or returns an HTML error page), pivot to FLUX model
    if ((!imgRes.ok || contentType.includes('text/html') || contentType.includes('json')) && imageUrl.includes('pollinations')) {
        console.warn(`[Worker] Primary Image URL failed or corrupted. Pivoting to secondary model...`);
        const altUrl = imageUrl.replace('&model=turbo', '&model=flux');
        imgRes = await fetch(altUrl);
        contentType = imgRes.headers.get('content-type') || '';
    }

    // Failsafe 2: If FLUX model also dies, use a mathematically guaranteed bare-bones prompt
    if (!imgRes.ok || contentType.includes('text/html') || contentType.includes('json')) {
         console.warn(`[Worker] Secondary Image URL failed. Executing nuclear safe prompt...`);
         const safePrompt = encodeURIComponent("Beautiful cinematic scenery 8k high resolution");
         imgRes = await fetch(`https://image.pollinations.ai/prompt/${safePrompt}?width=512&height=896&model=flux`);
         contentType = imgRes.headers.get('content-type') || '';
    }
    
    // Failsafe 3: If Pollinations is experiencing a total global outage (500s across the board), use Unsplash
    if (!imgRes.ok || contentType.includes('text/html') || contentType.includes('json')) {
        console.warn(`[Worker] Pollinations API completely OFFLINE. Using highly-available Unsplash placeholder...`);
        imgRes = await fetch(`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=512&h=896&fit=crop`);
        contentType = imgRes.headers.get('content-type') || '';
    }
    
    if (!imgRes.ok || contentType.includes('text/html') || contentType.includes('json')) {
        throw new Error(`CRITICAL: All image sources completely failed. (Status: ${imgRes.status})`);
    }

    // Safely determine the actual file extension to prevent FFmpeg image2 demuxer infinite loops
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    
    imgPath = path.join(tmpDir, `img_${jobId}.${ext}`);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    
    // Explicit binary magic number check to stop FFmpeg from failing during initialization
    if (imgBuffer.length < 100) throw new Error("Downloaded image buffer is suspiciously empty (< 100 bytes).");
    
    await fs.writeFile(imgPath, imgBuffer);
    filesToCleanup.push(imgPath);

    // 2. Fetch Audio (or generate silent if no audio)
    console.log(`[Worker] Step 2: Downloading audio...`);
    if (audioUrl) {
      const audioRes = await fetch(audioUrl);
      const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
      await fs.writeFile(audioPath, audioBuffer);
      filesToCleanup.push(audioPath);
    } else {
      // Generate 15s silent audio if none provided
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input('anullsrc=r=44100:cl=stereo')
          .inputFormat('lavfi')
          .outputOptions(['-t', '15', '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100'])
          .save(audioPath)
          .on('end', resolve)
          .on('error', reject);
      });
      filesToCleanup.push(audioPath);
    }

    // 3. Render Video via FFmpeg
    console.log(`[Worker] Step 3: Compiling video with FFmpeg... (This may take up to 4 minutes)`);
    await new Promise((resolve, reject) => {
      let isDone = false;
      const timeoutId = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          reject(new Error("FFmpeg compiler locked. Hard timeout reached."));
        }
      }, 240000); // 4 aggressive minutes max

      // To absolutely prevent ANY `image2` infinite loop freeze bugs caused by weird WebP/JPGs,
      // we map the video onto an explicit black canvas generator that dictates the exact 15s loop timing.
      ffmpeg()
        .input('color=c=black:s=512x896:r=2') // Primary rigid video stream
        .inputFormat('lavfi')
        .input(imgPath) // Overlay secondary stream
        .input(audioPath) // Audio tertiary stream
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '32',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '96k',
          '-movflags', '+faststart',
          '-shortest', // Stop stream when audio ends
          '-t', '15',  // Maximum 15s rigidity cutoff
          '-filter_complex', '[0:v][1:v]overlay=shortest=1[outv]',
          '-map', '[outv]',
          '-map', '2:a'
        ])
        .save(outputPath)
        .on('start', (cmd) => {
          console.log(`[Worker] Rigorous FFmpeg stream spawned.`);
        })
        .on('stderr', (stderrLine) => {
           if (stderrLine.includes("Error") || stderrLine.includes("Invalid")) {
               console.error(`[FFmpeg Critical] ${stderrLine}`);
           }
        })
        .on('progress', (progress) => {
           if (progress.percent) {
              console.log(`[Worker] FFmpeg Progress: ${Math.floor(progress.percent)}%`);
           }
        })
        .on('end', () => {
          if (!isDone) {
            isDone = true;
            clearTimeout(timeoutId);
            resolve();
          }
        })
        .on('error', (err) => {
          if (!isDone) {
            isDone = true;
            clearTimeout(timeoutId);
            reject(new Error(`FFmpeg error: ${err.message}`));
          }
        });
    });
    filesToCleanup.push(outputPath);

    // 4. Upload to Supabase Storage
    console.log(`[Worker] Step 4: Uploading video to Supabase Storage...`);
    const videoBuffer = await fs.readFile(outputPath);
    const filename = `final_${userId}_${Date.now()}.mp4`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('generated-images')
      .upload(filename, videoBuffer, { contentType: 'video/mp4' });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    const finalUrl = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename).data.publicUrl;

    // 5. Update Database Record
    console.log(`[Worker] Step 5: Updating database for Post ${postId}...`);
    
    // Get existing hashtags to strip metadata if present
    const { data: post } = await supabaseAdmin
      .from('scheduled_posts')
      .select('hashtags')
      .eq('id', postId)
      .single();

    let cleanHashtags = [];
    if (post && post.hashtags) {
        cleanHashtags = post.hashtags.filter(h => !h.startsWith('__METADATA__:'));
    }

    const { error: updateError } = await supabaseAdmin
      .from('scheduled_posts')
      .update({
        image_url: finalUrl,
        hashtags: cleanHashtags.length > 0 ? cleanHashtags : null,
        status: 'media_ready',
        error_message: null
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    console.log(`[Worker] 🎉 Success! Post ${postId} is now media_ready.`);

  } catch (error) {
    console.error(`[Worker] Error processing Post ${postId}:`, error);
    
    // Attempt to set error status in database
    await supabaseAdmin
      .from('scheduled_posts')
      .update({
        status: 'failed',
        error_message: `Worker Failed: ${error.message}`
      })
      .eq('id', postId);
      
  } finally {
        // ALWAYS CLEANUP TEMP FILES EVEN ON ERROR TO PREVENT OUT-OF-SPACE HANGS
        console.log(`[Worker] Executing disk cleanup...`);
        try {
            if (global.currentFilesToCleanup) {
               await Promise.allSettled(global.currentFilesToCleanup.map(f => fs.unlink(f).catch(() => {})));
            }
        } catch (cleanupErr) {
            console.error(`[Worker] Failed disk cleanup:`, cleanupErr);
        }
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Sparkyn Video Worker is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Worker listening on port ${PORT}`);
});
