export const tiktokService = {
  /**
   * Publishes a video to TikTok
   */
  async publishVideo(accessToken: string, params: {
    videoUrl: string;
    caption: string;
  }) {
    const url = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: params.videoUrl,
        },
        post_info: {
          title: params.caption.substring(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
      }),
    });

    return await response.json();
  }
};
