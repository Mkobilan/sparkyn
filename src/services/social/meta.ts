export const metaService = {
  /**
   * Publishes an image or video post to a Facebook Page
   */
  async publishToFacebook(accessToken: string, pageId: string, params: {
    imageUrl: string;
    caption: string;
    base64Image?: string;
    isVideo?: boolean;
  }) {
    // ──────────────────────────────────────────────────────────
    // VIDEO PATH: Facebook /videos requires multipart/form-data
    // ──────────────────────────────────────────────────────────
    if (params.isVideo) {
      const videoUrl = `https://graph.facebook.com/v19.0/${pageId}/videos`;
      try {
        // 1. Get the video bytes (from Supabase URL or data URI)
        let videoBuffer: Buffer;
        if (params.imageUrl.startsWith('data:')) {
          const base64Data = params.imageUrl.split(',')[1];
          videoBuffer = Buffer.from(base64Data, 'base64');
        } else {
          const videoResponse = await fetch(params.imageUrl);
          if (!videoResponse.ok) throw new Error(`Video download failed: ${videoResponse.status}`);
          videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        }

        console.log(`Facebook video upload: ${videoBuffer.length} bytes`);

        // 2. Upload as multipart/form-data binary (required by Graph API /videos)
        const formData = new FormData();
        formData.append('access_token', accessToken);
        formData.append('description', params.caption);
        const blob = new Blob([new Uint8Array(videoBuffer)], { type: 'video/mp4' });
        formData.append('source', blob, 'video.mp4');

        const response = await fetch(videoUrl, { method: 'POST', body: formData });
        const result = await response.json();

        if (result.id && !result.error) return result;

        // If the binary upload failed, log the error for debugging
        console.error('Facebook video upload error:', JSON.stringify(result));
        throw new Error(result.error?.message || 'Facebook video upload failed');
      } catch (err: any) {
        console.error("Facebook video upload failed:", err.message || err);
        return { error: { message: err.message || "Video upload failure" } };
      }
    }

    // ──────────────────────────────────────────────────────────
    // IMAGE PATH: Direct Binary Upload
    // ──────────────────────────────────────────────────────────
    const url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
    
    try {
      // 1. Download the image directly to bypass Facebook's URL Scraper bot entirely
      let imgBuffer: Buffer;
      if (params.imageUrl.startsWith('data:')) {
        const base64Data = params.imageUrl.split(',')[1];
        imgBuffer = Buffer.from(base64Data, 'base64');
      } else {
        const imgResponse = await fetch(params.imageUrl);
        if (!imgResponse.ok) throw new Error(`Fallback Image download failed: ${imgResponse.status}`);
        imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
      }

      // 2. Upload as multipart/form-data binary
      const photoFormData = new FormData();
      photoFormData.append('access_token', accessToken);
      photoFormData.append('message', params.caption);
      
      const blob = new Blob([new Uint8Array(imgBuffer)], { type: 'image/jpeg' });
      photoFormData.append('source', blob, 'image.jpg');

      const response = await fetch(url, { method: 'POST', body: photoFormData });
      const result = await response.json();

      if (result.id && !result.error) return result;


      // ATTEMPT 3: THE UNSTOPPABLE STATUS (Resilient-Status Bypass)
      if (result.error?.code === 324 || result.error?.error_subcode === 2069019 || result.error?.code === 100) {
        console.warn("Final Image Block detected. Triggering Resilient-Status Bypass...");
        const feedUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
        const feedResponse = await fetch(feedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            message: `${params.caption}\n\n${params.imageUrl}`
          }),
        });
        return await feedResponse.json();
      }

      return result;
    } catch (err) {
      console.error("Final fallback failed:", err);
      return { error: { message: "Internal fallback failure" } };
    }
  },

  /**
   * Publishes an image/video to Instagram Business account
   */
  async publishToInstagram(accessToken: string, igAccountId: string, params: {
    imageUrl: string;
    caption: string;
    isVideo?: boolean;
  }) {
    // 1. Create Media Container
    const containerUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
    
    const payload: any = {
        caption: params.caption,
        access_token: accessToken,
    };
    if (params.isVideo) {
        payload.video_url = params.imageUrl;
        payload.media_type = 'REELS';
    } else {
        payload.image_url = params.imageUrl;
    }
    
    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const containerData = await containerResponse.json();
    if (!containerData.id) return containerData;

    // 2. Publish Media Container
    const publishUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    });

    return await publishResponse.json();
  }
};
