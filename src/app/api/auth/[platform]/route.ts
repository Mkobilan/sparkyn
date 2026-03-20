import { NextRequest, NextResponse } from 'next/server'
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  
  // Get the base URL robustly
  let baseUrl = ''
  if (process.env.VERCEL_PROJECT_URL) {
    baseUrl = process.env.VERCEL_PROJECT_URL.replace(/\/$/, '')
  } else {
    const { origin } = new URL(request.url)
    baseUrl = origin
  }

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
    
    authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code`
  } else if (platform === 'tiktok') {
    // TikTok OAuth with PKCE and State
    const scopes = 'user.info.basic,video.publish,video.upload'
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = Math.random().toString(36).substring(2, 15)
    
    // Store code verifier and state in cookies
    const cookieStore = await cookies()
    cookieStore.set('tiktok_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    })
    cookieStore.set('tiktok_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    })

    authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`
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
