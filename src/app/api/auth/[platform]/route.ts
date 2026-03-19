import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const baseUrl = process.env.VERCEL_PROJECT_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/auth/callback/${platform}`

  let authUrl = ''

  if (platform === 'facebook' || platform === 'instagram') {
    // Meta OAuth
    const scopes = [
      'public_profile',
      'email',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',')
    
    authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`
  } else if (platform === 'tiktok') {
    // TikTok OAuth
    // Using the scopes mentioned in tiktok_submission.md
    const scopes = 'user.info.basic,video.upload'
    authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`
  } else if (platform === 'youtube') {
    // Google OAuth
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ')
    
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent`
  }

  if (authUrl) {
    return NextResponse.redirect(authUrl)
  }

  return NextResponse.json({ error: 'Platform not supported' }, { status: 400 })
}
