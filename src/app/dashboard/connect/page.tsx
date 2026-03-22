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
  ShieldCheck,
  AlertTriangle,
  Zap
} from 'lucide-react'
import FacebookSDK from '@/components/FacebookSDK'
import { getTierLimits } from '@/lib/pricing'
import Link from 'next/link'


export default function ConnectAccountsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [socialAccounts, setSocialAccounts] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)

      const { data: accountsData } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
      
      setSocialAccounts(accountsData || [])
    }
    fetchData()
  }, [supabase])

  const platforms = [
    { id: 'facebook', name: 'Facebook Page', icon: Facebook, color: '#1877F2' },
    { id: 'instagram', name: 'Instagram Business', icon: Instagram, color: '#E4405F' },
    { id: 'tiktok', name: 'TikTok Profile', icon: Music2, color: '#000000' },
    { id: 'youtube', name: 'YouTube Shorts', icon: Youtube, color: '#FF0000' },
  ]

  const isConnected = (id: string) => profile?.platforms?.includes(id)
  
  const getPlatformCount = (id: string) => socialAccounts.filter(a => a.platform === id).length
  const tierLimits = getTierLimits(profile?.subscription_tier)
  const isLimitReached = (id: string) => getPlatformCount(id) >= tierLimits.accountsPerPlatform

  const handleConnect = (id: string) => {
    if (isLimitReached(id)) return
    if (id === 'facebook' || id === 'instagram') {
      if (typeof window !== 'undefined' && window.FB) {
        window.FB.login((response: any) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            // Send to our backend to store
            fetch('/api/auth/facebook/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken, platform: id })
            }).then(() => {
              window.location.reload();
            });
          }
        }, { 
          scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,instagram_basic,instagram_content_publish'
        });
      } else {
        window.location.href = `/api/auth/${id}`
      }
    } else {
      window.location.href = `/api/auth/${id}`
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!profile) return
    
    // Remove from social_accounts table
    await supabase
      .from('social_accounts')
      .delete()
      .eq('user_id', profile.id)
      .eq('platform', id)

    // Remove from profiles.platforms array
    const newPlatforms = profile.platforms.filter((p: string) => p !== id)
    const { data, error } = await supabase
      .from('profiles')
      .update({ platforms: newPlatforms })
      .eq('id', profile.id)
      .select()
      .single()

    if (!error) {
      setProfile(data)
      setSocialAccounts(prev => prev.filter(a => a.platform !== id))
    }
  }

  const updateStrategy = async (accountId: string, strategy: string) => {
    const { error } = await supabase
      .from('social_accounts')
      .update({ content_strategy: strategy })
      .eq('id', accountId)
    
    if (!error) {
      setSocialAccounts(prev => prev.map(a => a.id === accountId ? { ...a, content_strategy: strategy } : a))
    }
  }

  return (
    <>
      <FacebookSDK appId="953923493837689" />
      <main className="main-content bg-gradient relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        
          <div className="mb-10">
            <h1 className="text-5xl font-black font-heading tracking-tighter text-white mb-3">Connect Accounts</h1>
            <p className="text-muted-foreground text-lg opacity-80">Link your social media profiles to ignite the Sparkyn engine.</p>
          </div>

          <div className="card-premium p-8 rounded-[2.5rem] border-primary/20 bg-primary/5 flex items-start gap-6 animate-fade-in-up shadow-[0_0_40px_-10px_hsla(var(--primary),0.15)] mb-10">
            <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30 shrink-0">
              <ShieldCheck className="text-primary w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-xl text-white">Secure Connection</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use official APIs for all connections. Your passwords are never stored, and you can revoke access at any time.
              </p>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {platforms.map((platform) => (
            <div key={platform.id} className={`card-premium p-10 group relative transition-all duration-500 ${isConnected(platform.id) ? 'border-primary/30 bg-primary/5' : 'hover:border-primary/20'}`}>
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-muted/50 border border-border rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 group-hover:border-primary/30">
                    <platform.icon className="w-9 h-9" style={{ color: platform.id === 'tiktok' || platform.id === 'youtube' ? 'hsl(var(--primary))' : platform.color }} />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-white font-heading tracking-tight">{platform.name.split(' ')[0]}</h3>
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Managed by AI</p>
                  </div>
                </div>
                {isConnected(platform.id) && (
                  <div className="p-2 bg-success/10 rounded-full border border-success/20">
                    <CheckCircle2 className="text-success w-6 h-6 animate-pulse" />
                  </div>
                )}
              </div>

              {isConnected(platform.id) ? (
                <div className="space-y-8 relative z-10">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Connected Pages</p>
                    {socialAccounts.filter(a => a.platform === platform.id).map(account => (
                      <div key={account.id} className="p-5 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between group/account hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_hsla(145,65%,42%,0.5)]" />
                          <span className="font-extrabold text-sm text-white">{account.platform_name || 'Connected Page'}</span>
                        </div>
                        <select 
                          value={account.content_strategy}
                          onChange={(e) => updateStrategy(account.id, e.target.value)}
                          className="bg-muted text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                          <option value="Balanced">Balanced</option>
                          <option value="Casual">Casual</option>
                          <option value="Professional">Professional</option>
                          <option value="Direct Sales">Direct Sales</option>
                          <option value="Educational">Educational</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  {isLimitReached(platform.id) ? (
                    <div className="p-6 rounded-[1.5rem] bg-primary/5 border border-primary/20 space-y-4">
                      <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                        <AlertTriangle className="w-4 h-4" /> Limit Reached
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your <span className="text-white font-black">{profile?.subscription_tier}</span> plan allows up to {tierLimits.accountsPerPlatform} {platform.name} connections.
                      </p>
                      <Link href="/dashboard/settings" className="btn btn-primary w-full text-[11px] h-10 font-black uppercase tracking-widest rounded-xl">
                        Upgrade Tier <Zap className="w-3.5 h-3.5 ml-2" />
                      </Link>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleConnect(platform.id)}
                      className="btn btn-outline w-full h-14 gap-2 border-dashed border-2 rounded-2xl font-extrabold text-sm hover:border-primary transition-all"
                    >
                      <Plus className="w-5 h-5" /> Connect Another
                    </button>
                  )}

                  <button 
                    onClick={() => handleDisconnect(platform.id)}
                    className="btn btn-ghost w-full text-destructive hover:bg-destructive/10 border border-destructive/10 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl"
                  >
                    Disconnect All
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleConnect(platform.id)}
                  className="btn btn-primary w-full h-16 gap-3 rounded-2xl text-lg font-black shadow-[0_8px_25px_-5px_hsla(var(--primary),0.4)] relative z-10"
                >
                  <Plus className="w-6 h-6" /> Connect {platform.name.split(' ')[0]}
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
    </>
  )
}
