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
          scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
          config_id: '1642865807168430'
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
    <div className="flex min-h-screen bg-background">
      <FacebookSDK appId="953923493837689" />
      <Sidebar />

      
      <main className="main-content bg-gradient relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div className="max-w-4xl space-y-8">
          <div>
            <h1 className="text-4xl font-black font-heading tracking-tight text-white mb-2">Connect Accounts</h1>
            <p className="text-muted-foreground">Link your social media profiles to ignite the Sparkyn engine.</p>
          </div>

          <div className="glass p-6 rounded-[2rem] border border-primary/20 bg-primary/5 flex items-start gap-4 animate-fade-in-up">
            <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
              <ShieldCheck className="text-primary w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Secure Connection</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We use official APIs for all connections. Your passwords are never stored, and you can revoke access at any time.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platforms.map((platform) => (
            <div key={platform.id} className="glass p-8 rounded-[2rem] border border-border/50 space-y-6 hover:border-primary/30 transition-all hover-glow group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-background border border-border rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <platform.icon className="w-8 h-8" style={{ color: platform.id === 'tiktok' || platform.id === 'youtube' ? 'hsl(var(--primary))' : platform.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white font-heading">{platform.name}</h3>
                    <p className="text-[10px] uppercase font-heavy tracking-widest text-muted-foreground">Official API Integration</p>
                  </div>
                </div>
                {isConnected(platform.id) && (
                  <CheckCircle2 className="text-success w-6 h-6 animate-pulse" />
                )}
              </div>

              {isConnected(platform.id) ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {socialAccounts.filter(a => a.platform === platform.id).map(account => (
                      <div key={account.id} className="p-4 rounded-xl bg-background/50 border border-border flex items-center justify-between group/account">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          <span className="font-bold text-sm">{account.platform_name || 'Connected Page'}</span>
                        </div>
                        <select 
                          value={account.content_strategy}
                          onChange={(e) => updateStrategy(account.id, e.target.value)}
                          className="bg-muted text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border-none focus:ring-1 focus:ring-primary cursor-pointer"
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
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" /> Limit Reached
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Your current <span className="text-white font-bold">{profile?.subscription_tier}</span> tier allows up to {tierLimits.accountsPerPlatform} {platform.name} connections.
                      </p>
                      <Link href="/api/checkout?tier=pro" className="btn btn-primary w-full text-[10px] h-9 py-0 font-black uppercase tracking-widest">
                        Upgrade for More <Zap className="w-3 h-3 ml-2" />
                      </Link>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleConnect(platform.id)}
                      className="btn btn-outline w-full gap-2 border-dashed border-2"
                    >
                      <Plus className="w-4 h-4" /> Connect Another {platform.name}
                    </button>
                  )}

                  <button 
                    onClick={() => handleDisconnect(platform.id)}
                    className="btn btn-ghost w-full text-destructive hover:bg-destructive/10 border border-destructive/10 text-xs font-bold uppercase tracking-widest"
                  >
                    Disconnect All {platform.name}s
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleConnect(platform.id)}
                  className="btn btn-primary w-full gap-2 py-4 rounded-xl shadow-[0_8px_20px_-6px_hsla(var(--primary),0.4)]"
                >
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
