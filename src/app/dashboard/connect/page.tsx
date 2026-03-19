'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Music2, 
  Plus, 
  X, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'

export default function ConnectAccountsPage() {
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(data)
    }
    fetchProfile()
  }, [supabase])

  const platforms = [
    { id: 'facebook', name: 'Facebook Page', icon: Facebook, color: '#1877F2' },
    { id: 'instagram', name: 'Instagram Business', icon: Instagram, color: '#E4405F' },
    { id: 'tiktok', name: 'TikTok Profile', icon: Music2, color: '#000000' },
    { id: 'youtube', name: 'YouTube Shorts', icon: Youtube, color: '#FF0000' },
  ]

  const isConnected = (id: string) => profile?.platforms?.includes(id)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Connect Accounts</h1>
          <p className="text-muted-foreground mt-1">Link your social media profiles to start automating.</p>
        </div>

        <div className="glass card bg-primary/5 border-primary/20 flex items-start gap-4 p-6">
          <div className="p-3 bg-primary/20 rounded-xl">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Secure Connection</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We use official APIs for all connections. Your passwords are never stored, and you can revoke access at any time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platforms.map((platform) => (
            <div key={platform.id} className="glass card space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-background border border-border rounded-xl">
                    <platform.icon className="w-8 h-8" style={{ color: platform.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{platform.name}</h3>
                    <p className="text-xs text-muted-foreground">Official API Integration</p>
                  </div>
                </div>
                {isConnected(platform.id) && (
                  <CheckCircle2 className="text-green-500 w-6 h-6" />
                )}
              </div>

              {isConnected(platform.id) ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-green-500/10 text-green-500 text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Connected as @{profile.business_name.toLowerCase().replace(' ', '')}
                  </div>
                  <button className="btn btn-secondary w-full text-destructive hover:bg-destructive/10 border-destructive/10">
                    Disconnect Account
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary w-full gap-2">
                  <Plus className="w-4 h-4" /> Connect {platform.name}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-8 text-center glass card border-dashed border-2 border-border">
          <p className="text-muted-foreground text-sm">
            Need help connecting? <button className="text-primary hover:underline flex-inline items-center gap-1">Check our guide <ExternalLink className="w-3 h-3 inline" /></button>
          </p>
        </div>
      </main>
    </div>
  )
}
