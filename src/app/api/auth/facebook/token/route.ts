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

    const userAccessToken = tokenData.access_token || accessToken

    // 1. Fetch the user's managed pages
    const pagesResp = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`)
    const pagesData = await pagesResp.json()

    if (pagesData.error) {
      throw new Error(pagesData.error.message)
    }

    const pages = pagesData.data || []
    
    // 2. Store each page in social_accounts
    for (const page of pages) {
      const { error: upsertError } = await supabase
        .from('social_accounts')
        .upsert({
          user_id: user.id,
          platform: 'facebook',
          platform_user_id: page.id,
          platform_name: page.name,
          access_token: page.access_token, // Page access tokens don't expire usually
          metadata: {
            category: page.category,
            perms: page.tasks
          },
          is_active: true,
        }, { onConflict: 'user_id,platform,platform_user_id' })

      if (upsertError) console.error(`Failed to store page ${page.name}:`, upsertError)
    }

    // 3. Handle Instagram (optional but often linked to pages)
    // We could fetch IG accounts linked to these pages here...

    // Update profile.platforms
    const { data: profile } = await supabase.from('profiles').select('platforms').eq('id', user.id).single()
    const currentPlatforms = profile?.platforms || []
    if (!currentPlatforms.includes('facebook')) {
      await supabase.from('profiles').update({ platforms: [...currentPlatforms, 'facebook'] }).eq('id', user.id)
    }

    return NextResponse.json({ success: true, pageCount: pages.length })
  } catch (error: any) {

    console.error('Meta Token Storage Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
