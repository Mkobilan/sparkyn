import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // 1. Verify Authorization
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // 2. Fetch all users whose onboarding is complete
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, posting_times')
      .eq('onboarding_completed', true)

    if (userError || !users) {
      return NextResponse.json({ error: 'Fetch users failed' }, { status: 500 })
    }

    // 3. For each user, check if they have a post scheduled for "now"
    // In a real app, you'd check against the current time and their posting_times
    // For simplicity, we trigger generation if no posts are scheduled for today
    
    for (const user of users) {
      // Logic to trigger /api/generate or /api/publish based on time
      console.log("Processing user:", user.id)
      
      // Example: Call internal generate route
      // fetch(`https://${process.env.VERCEL_PROJECT_URL}/api/generate`, { ... })
    }

    return NextResponse.json({ success: true, processed: users.length })
  } catch (error: any) {
    console.error('Cron processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
