'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profile)

      // PROTECTION LOGIC:
      // If user is on Free tier but has a pending_tier (they signed up for a plan but hasn't paid),
      // or if they are just on Free tier and trying to access restricted things (optional),
      // redirect them to checkout.
      if (profile?.subscription_tier === 'free' && profile?.pending_tier && profile.pending_tier !== 'free') {
        // Allow access to settings to maybe change plan? 
        // For now, let's just force checkout if they have a pending tier.
        if (pathname !== '/dashboard/settings') {
           router.push(`/api/checkout?tier=${profile.pending_tier}`)
           return
        }
      }

      setLoading(false)
    }

    checkAuthAndSubscription()
  }, [supabase, router, pathname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          {children}
        </Suspense>
      </div>
    </div>
  )
}
