import { google } from 'googleapis';
import { Readable } from 'stream';

export const youtubeService = {
  /**
   * Refreshes the YouTube OAuth2 access token
   */
  async refreshAccessToken(refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  },

  /**
   * Uploads a video to YouTube as a Short
   * YouTube Shorts are regular videos with #Shorts in Title/Description or 9:16 aspect ratio.
   */
  async publishShort(accessToken: string, params: {
    videoUrl: string;
    title: string;
    description: string;
  }) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    // 1. Download video from URL to a buffer/stream
    const videoResponse = await fetch(params.videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoStream = new Readable();
    videoStream.push(Buffer.from(videoBuffer));
    videoStream.push(null);

    // 2. Perform the upload
    try {
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: `${params.title} #Shorts`,
            description: `${params.description} #Shorts`,
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: videoStream,
        },
      });

      return {
        id: response.data.id || '',
        status: response.data.status,
        url: `https://youtube.com/watch?v=${response.data.id}`
      };
    } catch (error: any) {
      console.error('YouTube publish error:', error.response?.data || error.message);
      throw error;
    }
  }
};
