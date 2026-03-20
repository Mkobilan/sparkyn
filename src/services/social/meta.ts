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
    
    // Use manual multipart extraction ONLY for images, MP4 boundary corruption inside Next fetch deletes the video post-processing
    // Ensure base64Image is a healthy length (>1000 bytes) to avoid Meta API "invalid image" 500s
    if (params.base64Image && params.base64Image.length > 1000 && !params.isVideo) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const filename = params.isVideo ? 'video.mp4' : 'image.jpg';
      const contentType = params.isVideo ? 'video/mp4' : 'image/jpeg';
      const captionField = params.isVideo ? 'description' : 'message';
      
      const payloadPre = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${captionField}"\r\n\r\n` +
        `${params.caption}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="access_token"\r\n\r\n` +
        `${accessToken}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="source"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`
      );
      
      const payloadImage = Buffer.from(params.base64Image, 'base64');
      const payloadPost = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([payloadPre, payloadImage, payloadPost]);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length.toString()
        },
        body: body,
      });
      return await response.json();
    }

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
