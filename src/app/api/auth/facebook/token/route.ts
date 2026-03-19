import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { accessToken, platform } = await request.json()
  
  if (!accessToken) {
    return NextResponse.json({ error: 'No access token provided' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Exchange for long-lived token if possible
    const longLivedResp = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${accessToken}`)
    const tokenData = await longLivedResp.json()
    
    if (tokenData.error) {
      console.error('Meta Token Exchange Error:', tokenData.error)
    }

    const finalToken = tokenData.access_token || accessToken

    // Store in social_accounts
    const { error: upsertError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform,
        access_token: finalToken,
        is_active: true,
      }, { onConflict: 'user_id,platform' })

    if (upsertError) throw upsertError

    // Update profile.platforms
    const { data: profile } = await supabase.from('profiles').select('platforms').eq('id', user.id).single()
    const platforms = profile?.platforms || []
    if (!platforms.includes(platform)) {
      await supabase.from('profiles').update({ platforms: [...platforms, platform] }).eq('id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Meta Token Storage Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
