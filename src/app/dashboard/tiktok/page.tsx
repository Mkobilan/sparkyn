'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { 
  Music2, 
  Settings2, 
  Plus, 
  Calendar,
  Layers,
  BarChart3,
  ChevronRight,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Copy
} from 'lucide-react'
import Link from 'next/link'

export default function TikTokDashboard() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [scheduledTimes, setScheduledTimes] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ business_name: '', industry: '', niche: '', description: '', goal: '' })
  const supabase = createClient()

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'tiktok')
    
    setAccounts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleGenerate = async (accountId: string, publishNow: boolean = false, isVideo: boolean = false) => {
    setGeneratingId(accountId)
    try {
      const scheduledAt = scheduledTimes[accountId]
      const response = await fetch('/api/generate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, publishNow, scheduledAt, isVideo })
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown server error');
        const isTimeout = response.status === 504 || response.status === 408;
        setErrorModal(isTimeout 
          ? 'The request timed out. Video generation takes time — try again or schedule it instead.' 
          : `Server error (${response.status}): ${errorText.slice(0, 200)}`);
        return;
      }
      const data = await response.json()
      if (data.success) {
        if (publishNow) {
          alert('Video published to TikTok! (Speed Mode enabled)')
        } else {
          alert('Video scheduled! Media will be generated automatically in the background.')
        }
        fetchAccounts()
      } else {
        setErrorModal(`Failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error(error)
      setErrorModal(`Network error: ${error.message}`)
    } finally {
      setGeneratingId(null)
    }
  }

  const updateStrategy = async (accountId: string, strategy: string) => {
    const { error } = await supabase
      .from('social_accounts')
      .update({ content_strategy: strategy })
      .eq('id', accountId)
    
    if (!error) {
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, content_strategy: strategy } : a))
    } else {
      console.error('Update Strategy Error:', error)
      alert(`Failed to update strategy: ${error.message}`)
    }
  }

  const handleEditClick = (account: any) => {
    if (editingId === account.id) {
      setEditingId(null)
    } else {
      setEditingId(account.id)
      setEditForm({
        business_name: account.metadata?.business_name || '',
        industry: account.metadata?.industry || '',
        niche: account.metadata?.niche || '',
        description: account.metadata?.description || '',
        goal: account.metadata?.goal || ''
      })
    }
  }

  const saveSettings = async (accountId: string, currentMetadata: any) => {
    const newMetadata = { ...currentMetadata, ...editForm }
    const { error } = await supabase
      .from('social_accounts')
      .update({ metadata: newMetadata })
      .eq('id', accountId)
      
    if (!error) {
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, metadata: newMetadata } : a))
      setEditingId(null)
      alert('Profile settings saved!')
    } else {
      alert(`Failed to save settings: ${error.message}`)
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-white relative">
      <Sidebar />

      {errorModal && (
        <div className="fixed inset-0 bg-[#000000]/95 z-[99999] flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border-2 border-red-500 p-8 rounded-[2.5rem] max-w-2xl w-full shadow-[0_0_100px_rgba(239,68,68,0.4)] relative animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-extrabold text-red-500 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-full"><AlertCircle className="w-5 h-5" /></div>
                Generation Exception
              </h3>
            </div>
            <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 text-red-200 text-sm max-h-[300px] overflow-y-auto font-mono whitespace-pre-wrap mb-6">
              {errorModal}
            </div>
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(errorModal)
                  alert('Error snippet copied to clipboard!')
                }} 
                className="btn bg-muted hover:bg-muted/80 text-white font-bold gap-2 px-6 py-3 rounded-xl transition-all"
              >
                <Copy className="w-4 h-4" /> Copy Trace
              </button>
              <button onClick={() => setErrorModal(null)} className="btn bg-red-500 hover:bg-red-500/90 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="main-content flex-1 p-8 bg-gradient relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00f2ea]/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#ff0050]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                  <Music2 className="w-10 h-10 text-primary" />
                </div>
                TikTok Profiles
              </h1>
              <p className="text-muted-foreground font-medium max-w-md">
                Manage your TikTok accounts, trending strategies, and automated video generation.
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
                <Plus className="w-5 h-5" /> Connect TikTok
              </Link>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="card p-8 space-y-6 hover:border-primary/40 transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform shadow-[4px_0_0_#00f2ea,-4px_0_0_#ff0050]">
                      {account.platform_name?.[0] || 'T'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl group-hover:text-primary transition-colors">{account.platform_name || 'TikTok User'}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Creator Profile</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${account.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}`}>
                    {account.is_active ? 'Active' : 'Paused'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Content Vibe</label>
                    <select 
                      value={account.content_strategy}
                      onChange={(e) => updateStrategy(account.id, e.target.value)}
                      className="w-full bg-muted border-border font-bold text-sm h-12 rounded-xl focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option>Balanced</option>
                      <option>Trending</option>
                      <option>Educational</option>
                      <option>Funny/POV</option>
                      <option>Storytelling</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Schedule</label>
                    <div className="h-12 bg-muted rounded-xl flex items-center px-4 font-bold text-sm border border-border/50 text-primary">
                      <input 
                        type="datetime-local" 
                        value={scheduledTimes[account.id] || ''}
                        onChange={(e) => setScheduledTimes({ ...scheduledTimes, [account.id]: e.target.value })}
                        className="bg-transparent border-none outline-none w-full text-white cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleGenerate(account.id, true, false)}
                      disabled={!!generatingId}
                      className="flex-1 btn btn-primary font-bold gap-2 py-3 rounded-xl shadow-lg"
                    >
                      {generatingId === account.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Publish Image
                    </button>
                    <button 
                      onClick={() => handleGenerate(account.id, false, false)}
                      disabled={!!generatingId}
                      className="flex-1 btn btn-outline border-primary/20 hover:bg-primary/10 text-primary font-bold gap-2 py-3 rounded-xl"
                    >
                      Schedule AI Image
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleGenerate(account.id, true, true)}
                      disabled={!!generatingId}
                      className="flex-1 btn bg-primary border-primary hover:bg-primary/90 text-background font-bold gap-2 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(0,242,234,0.39)]"
                    >
                      {generatingId === account.id ? <Loader2 className="w-4 h-4 animate-spin text-background" /> : <Sparkles className="w-4 h-4 text-background" />}
                      Publish Video
                    </button>
                    <button 
                      onClick={() => handleGenerate(account.id, false, true)}
                      disabled={!!generatingId}
                      className="flex-1 btn btn-outline border-primary/20 hover:bg-primary/10 text-primary font-bold gap-2 py-3 rounded-xl"
                    >
                      Schedule Video
                    </button>
                    <button onClick={() => handleEditClick(account)} className={`btn w-12 h-12 p-0 rounded-xl border ${editingId === account.id ? 'bg-primary/10 border-primary text-primary' : 'btn-ghost border-border/50 text-muted-foreground'}`}>
                      <Settings2 className="w-5 h-5 cursor-pointer" />
                    </button>
                  </div>
                </div>

                {editingId === account.id && (
                  <div className="mt-6 p-6 border border-border/50 rounded-2xl bg-muted/20 space-y-4">
                    <h4 className="font-extrabold text-sm uppercase tracking-widest text-muted-foreground mb-4">Profile-Specific Overrides</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Business Name</label>
                        <input value={editForm.business_name} onChange={e => setEditForm({...editForm, business_name: e.target.value})} placeholder="Override global name..." className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Industry</label>
                        <input value={editForm.industry} onChange={e => setEditForm({...editForm, industry: e.target.value})} placeholder="e.g. Local Bakery" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Niche / Target Audience</label>
                        <input value={editForm.niche} onChange={e => setEditForm({...editForm, niche: e.target.value})} placeholder="e.g. Gen-Z Tech Enthusiasts" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Profile Description</label>
                        <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Describe what this specific TikTok profile promotes..." className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium h-24 resize-none" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Goal</label>
                        <input value={editForm.goal} onChange={e => setEditForm({...editForm, goal: e.target.value})} placeholder="e.g. Viral brand awareness" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button onClick={() => saveSettings(account.id, account.metadata)} className="btn btn-primary font-bold px-8 py-3 rounded-xl shadow-lg">
                        Save Profile Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {accounts.length === 0 && !loading && (
              <div className="col-span-2 p-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music2 className="w-10 h-10 text-primary/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold">No TikTok Linked</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                    Connect your TikTok profile to start generating viral short-form content.
                  </p>
                </div>
                <Link href="/dashboard/connect" className="btn btn-primary px-8 rounded-2xl h-14 font-bold inline-flex">
                  Connect TikTok
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
