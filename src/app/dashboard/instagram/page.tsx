'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { 
  Instagram, 
  Settings2, 
  Plus, 
  Calendar,
  Layers,
  BarChart3,
  ChevronRight,
  Loader2,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

export default function InstagramDashboard() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const supabase = createClient()

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
    
    setAccounts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleGenerate = async (accountId?: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      })
      const data = await response.json()
      if (data.success) {
        // Refresh or show success
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const updateStrategy = async (accountId: string, strategy: string) => {
    const { error } = await supabase
      .from('social_accounts')
      .update({ content_strategy: strategy })
      .eq('id', accountId)
    
    if (!error) {
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, content_strategy: strategy } : a))
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-white">
      <Sidebar />
      
      <main className="main-content flex-1 p-8 bg-gradient relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E4405F]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4">
                <div className="p-3 bg-[#E4405F]/10 rounded-2xl border border-[#E4405F]/20">
                  <Instagram className="w-10 h-10 text-[#E4405F]" />
                </div>
                Instagram Accounts
              </h1>
              <p className="text-muted-foreground font-medium max-w-md">
                Manage your Instagram Business profiles, aesthetic strategies, and automated reels/posts.
              </p>
            </div>
            <div className="flex gap-4">
               <button 
                onClick={() => fetchAccounts()}
                className="btn btn-outline h-14 w-14 p-0 rounded-2xl border-border/50"
              >
                <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/dashboard/connect" className="btn btn-primary h-14 px-8 rounded-2xl font-bold gap-3 shadow-lg">
                <Plus className="w-5 h-5" /> Connect Account
              </Link>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="card p-8 space-y-6 hover:border-[#E4405F]/40 transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#E4405F]/5 rounded-full blur-3xl group-hover:bg-[#E4405F]/10 transition-all" />
                
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1px] group-hover:scale-110 transition-transform duration-500">
                      <div className="w-full h-full bg-background rounded-[15px] flex items-center justify-center font-black text-2xl">
                        {account.platform_name?.[0] || 'I'}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl group-hover:text-[#ee2a7b] transition-colors">{account.platform_name || 'Instagram Account'}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Business Profile</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${account.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}`}>
                    {account.is_active ? 'Active' : 'Paused'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aesthetic Strategy</label>
                    <select 
                      value={account.content_strategy}
                      onChange={(e) => updateStrategy(account.id, e.target.value)}
                      className="w-full bg-muted border-border font-bold text-sm h-12 rounded-xl focus:ring-[#ee2a7b] appearance-none cursor-pointer"
                    >
                      <option>Balanced</option>
                      <option>Minimalist</option>
                      <option>Vibrant</option>
                      <option>Professional</option>
                      <option>Story-Led</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reels Frequency</label>
                    <div className="h-12 bg-muted rounded-xl flex items-center px-4 font-bold text-sm border border-border/50">
                      Every 2 Days
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleGenerate(account.id)}
                    disabled={isGenerating}
                    className="flex-1 btn btn-outline border-[#E4405F]/20 hover:bg-[#E4405F]/10 text-[#E4405F] font-bold gap-2 py-4 rounded-xl"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Reel
                  </button>
                  <button className="btn btn-ghost w-14 h-14 p-0 rounded-xl border border-border/50">
                    <Settings2 className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}

            {accounts.length === 0 && !loading && (
              <div className="col-span-2 p-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-[#E4405F]/10 flex items-center justify-center">
                  <Instagram className="w-10 h-10 text-[#E4405F]/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold">No IG Accounts</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                    Link your Instagram Business account by connecting through Facebook.
                  </p>
                </div>
                <Link href="/dashboard/connect" className="btn btn-primary px-8 rounded-2xl h-14 font-bold inline-flex">
                  Fix Connection
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
