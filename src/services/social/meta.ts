export const metaService = {
  /**
   * Publishes an image post to a Facebook Page
   */
  async publishToFacebook(accessToken: string, pageId: string, params: {
    imageUrl: string;
    caption: string;
    base64Image?: string;
  }) {
    const url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
    
    if (params.base64Image) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      
      const payloadPre = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="message"\r\n\r\n` +
        `${params.caption}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="access_token"\r\n\r\n` +
        `${accessToken}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="source"; filename="image.jpg"\r\n` +
        `Content-Type: image/jpeg\r\n\r\n`
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

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: params.imageUrl,
        message: params.caption,
        access_token: accessToken,
      }),
    });

    return await response.json();
  },

  /**
   * Publishes an image/video to Instagram Business account
   */
  async publishToInstagram(accessToken: string, igAccountId: string, params: {
    imageUrl: string;
    caption: string;
  }) {
    // 1. Create Media Container
    const containerUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: params.imageUrl,
        caption: params.caption,
        access_token: accessToken,
      }),
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
