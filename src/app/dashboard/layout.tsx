'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Loader2 } from 'lucide-react'
import PricingModal from '@/components/PricingModal'

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
      setLoading(false)
    }

    checkAuthAndSubscription()
  }, [supabase, router, pathname])

  const isUnpaid = profile?.subscription_tier === 'free'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isUnpaid) {
    return <PricingModal />
  }

  return (
    <div className="flex min-h-screen bg-background relative">
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
