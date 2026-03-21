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
      // We check both the DB Profile AND the Auth User Metadata (as a fallback/immediate source)
      const currentTier = profile?.subscription_tier || 'free'
      const activePendingTier = profile?.pending_tier || user.user_metadata?.tier

      if (currentTier === 'free' && activePendingTier && activePendingTier !== 'free') {
        // Redirection logic: Force checkout if they have a pending tier but haven't paid
        if (pathname !== '/dashboard/settings') {
           console.log(`[Payment Gate] Redirecting to checkout for tier: ${activePendingTier}`)
           router.replace(`/api/checkout?tier=${activePendingTier}`)
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
