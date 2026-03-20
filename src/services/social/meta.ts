export const metaService = {
  /**
   * Publishes an image post to a Facebook Page
   */
  async publishToFacebook(accessToken: string, pageId: string, params: {
    imageUrl: string;
    caption: string;
    base64Image?: string;
    isVideo?: boolean;
  }) {
    const endpoint = params.isVideo ? 'videos' : 'photos';
    const url = `https://graph.facebook.com/v19.0/${pageId}/${endpoint}`;
    
    // Attempt 1: Native FormData Binary Upload (Fastest & avoids DNS propagate issues)
    if (params.base64Image && params.base64Image.length > 1000 && !params.isVideo) {
      try {
        const formData = new FormData();
        const captionField = params.isVideo ? 'description' : 'message';
        formData.append(captionField, params.caption);
        formData.append('access_token', accessToken);
        
        const buffer = Buffer.from(params.base64Image, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('source', blob, 'image.jpg');

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        
        // RECURSIVE FALLBACK: If Meta returns "Ad-Safety" Error 324 (Subcode 2069019), 
        // fall back to the URL method. Facebook's URL-Scraper often bypasses strict binary filters.
        if (result.error?.code === 324 || result.error?.error_subcode === 2069019) {
          console.warn("Meta Ad-Safety block detected (Code 324). Falling back to URL-Scraper method...");
        } else {
          return result;
        }
      } catch (err) {
        console.error("Binary upload failed, falling back to URL...", err);
      }
    }

    // Attempt 2: URL-based Scraper Upload (Fallback for Ad-Safety filters)
    const payload: any = {
      access_token: accessToken,
    };
    if (params.isVideo) {
      payload.file_url = params.imageUrl;
      payload.description = params.caption;
    } else {
      payload.url = params.imageUrl;
      payload.message = params.caption;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await response.json();
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
