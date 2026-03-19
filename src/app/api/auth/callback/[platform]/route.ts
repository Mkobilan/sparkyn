import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(`${process.env.VERCEL_PROJECT_URL || 'http://localhost:3000'}/dashboard/connect?error=no_code`)
  }

  const baseUrl = process.env.VERCEL_PROJECT_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/auth/callback/${platform}`
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  try {
    let tokenData: any = {}
    
    if (platform === 'facebook' || platform === 'instagram') {
      const resp = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.META_APP_SECRET}&code=${code}`)
      tokenData = await resp.json()
      
      if (tokenData.error) throw new Error(tokenData.error.message)
      
      // ForMeta, we might want to exchange for a long-lived token
      const longLivedResp = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`)
      tokenData = await longLivedResp.json()
    } else if (platform === 'tiktok') {
      const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      })
      tokenData = await resp.json()
      if (tokenData.error) throw new Error(tokenData.error)
    } else if (platform === 'youtube') {
      const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.YOUTUBE_CLIENT_ID!,
          client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      })
      tokenData = await resp.json()
      if (tokenData.error) throw new Error(tokenData.error)
    }

    // Store in social_accounts
    const { error: upsertError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        is_active: true,
      }, { onConflict: 'user_id,platform' })

    if (upsertError) throw upsertError

    // Update profile.platforms
    const { data: profile } = await supabase.from('profiles').select('platforms').eq('id', user.id).single()
    const platforms = profile?.platforms || []
    if (!platforms.includes(platform)) {
      await supabase.from('profiles').update({ platforms: [...platforms, platform] }).eq('id', user.id)
    }

    return NextResponse.redirect(`${baseUrl}/dashboard/connect?success=true&platform=${platform}`)
  } catch (error: any) {
    console.error('OAuth Callback Error:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard/connect?error=${encodeURIComponent(error.message)}`)
  }
}
