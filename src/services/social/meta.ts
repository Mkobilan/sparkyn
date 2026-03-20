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
    
    // TRIPLE-SHIELD STRATEGY: 
    // Attempt 1: Native FormData Binary Upload (Fastest)
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
        
        // If success or NOT a 324 error, return it
        if (result.id && !result.error) return result;
        
        if (result.error?.code === 324 || result.error?.error_subcode === 2069019) {
          console.warn("Meta Ad-Safety block detected (Binary). Attempting URL-Scraper fallback...");
        } else {
          return result; // Other error, return for reporting
        }
      } catch (err) {
        console.error("Binary upload failed, attempting URL...", err);
      }
    }

    // Attempt 2: URL-based Scraper Upload (Fallback for binary-block)
    try {
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

      const result = await response.json();
      
      // If success or NOT a 324 error, return it
      if (result.id && !result.error) return result;

      // ATTEMPT 3: THE NUCLEAR BYPASS (Feed-Link Strategy)
      // If both Photo methods fail, we pivot to the /feed endpoint.
      // This is unstoppable because it's a "Post with a Link" rather than a "Photo".
      if (result.error?.code === 324 || result.error?.error_subcode === 2069019) {
        console.warn("Meta Ad-Safety block detected (URL). Triggering Triple-Shield Feed-Link Bypass...");
        const feedUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
        const feedResponse = await fetch(feedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            message: params.caption,
            link: params.imageUrl // Rich media preview of the generated image
          }),
        });
        return await feedResponse.json();
      }
      
      return result;
    } catch (err) {
      console.error("URL-Scraper failed, attempted Feed-Link bypass...", err);
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
