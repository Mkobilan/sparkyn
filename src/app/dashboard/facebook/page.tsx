'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { 
  Facebook, 
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

export default function FacebookDashboard() {
  const [pages, setPages] = useState<any[]>([])
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [scheduledTimes, setScheduledTimes] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ business_name: '', industry: '', niche: '', description: '', goal: '' })
  const supabase = createClient()

  const fetchPages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: fbError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
    
    if (fbError) console.error("FB Pages Fetch Error:", fbError)
    
    const { data: queueData, error: queueError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .contains('platforms', ['facebook'])
      .order('scheduled_at', { ascending: true })
      .limit(5)
      
    if (queueError) console.error("FB Queue Fetch Error:", queueError)
    
    setPages(data || [])
    setQueue(queueData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPages()
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
          : `Server error (${response.status}): ${errorText.slice(0, 300)}`);
        return;
      }
      const data = await response.json()
      if (data.success) {
        const published = data.summary?.published || 0;
        const scheduled = data.summary?.scheduled || 0;
        if (published > 0) {
          const linkInfo = data.publishLinks?.length > 0 ? `\n\nView it: ${data.publishLinks[0].url}` : '';
          alert(`✅ Published successfully to your page!${linkInfo}`)
        } else if (scheduled > 0) {
          alert(`📅 Content generated and scheduled! It will be posted at the scheduled time.`)
        } else {
          alert('Content created and saved.')
        }
        fetchPages()
      } else {
        const errorDetail = data.errors?.join('\n') || data.error || 'Unknown error';
        setErrorModal(`Publishing failed:\n\n${errorDetail}`)
      }
    } catch (error: any) {
      console.error("Dashboard handleGenerate Error:", error)
      const msg = error.message || "Unknown Network Exception"
      setErrorModal(`Network error: ${msg}`)
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
      setPages(prev => prev.map(a => a.id === accountId ? { ...a, content_strategy: strategy } : a))
    } else {
      console.error('Update Strategy Error:', error)
      alert(`Failed to update strategy: ${error.message}`)
    }
  }

  const handleEditClick = (page: any) => {
    if (editingId === page.id) {
      setEditingId(null)
    } else {
      setEditingId(page.id)
      setEditForm({
        business_name: page.metadata?.business_name || '',
        industry: page.metadata?.industry || '',
        niche: page.metadata?.niche || '',
        description: page.metadata?.description || '',
        goal: page.metadata?.goal || ''
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
      setPages(prev => prev.map(a => a.id === accountId ? { ...a, metadata: newMetadata } : a))
      setEditingId(null)
      alert('Page settings saved!')
    } else {
      alert(`Failed to save settings: ${error.message}`)
    }
  }

  return (
    <div className="text-white relative">
      
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

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-end mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#1877F2]/10 rounded-2xl border border-[#1877F2]/20 shadow-[0_0_30px_-5px_hsla(214,89%,52%,0.2)]">
                  <Facebook className="w-12 h-12 text-[#1877F2]" />
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tighter font-heading text-white">Facebook Pages</h1>
                  <p className="text-muted-foreground text-lg font-medium opacity-80 mt-1">Manage, strategize, and automate your Facebook presence.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
               <button 
                onClick={() => fetchPages()}
                className="btn btn-outline h-16 w-16 p-0 rounded-2xl border-border/50 hover:border-[#1877F2]/30 transition-all"
              >
                <RefreshCw className={`w-7 h-7 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/dashboard/connect" className="btn btn-primary h-16 px-10 rounded-2xl font-black gap-3 shadow-[0_10px_30px_-5px_hsla(var(--primary),0.5)] text-lg">
                <Plus className="w-6 h-6" /> Connect Page
              </Link>
            </div>
          </div>

          {/* Pages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pages.map((page) => (
              <div key={page.id} className="card-premium p-10 space-y-8 hover:border-[#1877F2]/40 transition-all group overflow-hidden relative shadow-[0_0_50px_-15px_hsla(214,89%,52%,0.1)]">
                <div className="absolute -right-4 -top-4 w-40 h-40 bg-[#1877F2]/5 rounded-full blur-3xl group-hover:bg-[#1877F2]/10 transition-all" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center font-black text-3xl text-[#1877F2] shadow-inner group-hover:scale-110 transition-transform duration-500">
                      {page.platform_name?.[0] || 'F'}
                    </div>
                    <div>
                      <h3 className="font-black text-2xl text-white group-hover:text-[#1877F2] transition-colors tracking-tight">{page.platform_name || 'Unnamed Page'}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">{page.metadata?.category || 'Facebook Page'}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${page.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border/50'}`}>
                    {page.is_active ? 'Active' : 'Paused'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Strategy</label>
                    <select 
                      value={page.content_strategy}
                      onChange={(e) => updateStrategy(page.id, e.target.value)}
                      className="w-full bg-muted/30 border-border/50 font-black text-[11px] h-14 rounded-2xl focus:ring-[#1877F2] appearance-none cursor-pointer px-5 transition-all hover:bg-muted/50 uppercase tracking-widest text-white"
                    >
                      <option>Balanced</option>
                      <option>Casual</option>
                      <option>Professional</option>
                      <option>Direct Sales</option>
                      <option>Educational</option>
                      <option>Storytelling</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Schedule</label>
                    <div className="h-14 bg-muted/30 rounded-2xl flex items-center px-5 font-bold text-sm border border-border/50 hover:bg-muted/50 transition-all">
                      <input 
                        type="datetime-local" 
                        value={scheduledTimes[page.id] || ''}
                        onChange={(e) => setScheduledTimes({ ...scheduledTimes, [page.id]: e.target.value })}
                        className="bg-transparent border-none outline-none w-full text-white cursor-pointer invert brightness-200"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleGenerate(page.id, true, false)}
                      disabled={!!generatingId}
                      className="flex-1 btn btn-primary font-black uppercase tracking-widest text-[11px] gap-2 h-14 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                      {generatingId === page.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Post Image
                    </button>
                    <button 
                      onClick={() => handleGenerate(page.id, false, false)}
                      disabled={!!generatingId}
                      className="flex-1 btn btn-outline border-[#1877F2]/30 hover:bg-[#1877F2]/10 text-[#1877F2] font-black uppercase tracking-widest text-[11px] gap-2 h-14 rounded-2xl transition-all"
                    >
                      Schedule AI
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleGenerate(page.id, true, true)}
                      disabled={!!generatingId}
                      className="flex-1 btn bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-black uppercase tracking-widest text-[11px] gap-2 h-14 rounded-2xl shadow-[0_10px_30px_-5px_hsla(214,89%,52%,0.4)] transition-all hover:scale-105 active:scale-95"
                    >
                      {generatingId === page.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Post Video
                    </button>
                    <button 
                      onClick={() => handleGenerate(page.id, false, true)}
                      disabled={!!generatingId}
                      className="flex-1 btn btn-outline border-[#1877F2]/30 hover:bg-[#1877F2]/10 text-[#1877F2] font-black uppercase tracking-widest text-[11px] gap-2 h-14 rounded-2xl transition-all"
                    >
                      Schedule Reel
                    </button>
                    <button onClick={() => handleEditClick(page)} className={`btn btn-ghost w-14 h-14 p-0 rounded-2xl border ${editingId === page.id ? 'bg-primary/20 border-primary text-primary shadow-lg' : 'border-border/50 text-muted-foreground'} transition-all`}>
                      <Settings2 className="w-6 h-6 cursor-pointer" />
                    </button>
                  </div>
                </div>

                {editingId === page.id && (
                  <div className="mt-6 p-6 border border-border/50 rounded-2xl bg-muted/20 space-y-4">
                    <h4 className="font-extrabold text-sm uppercase tracking-widest text-muted-foreground mb-4">Page-Specific Overrides</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1877F2]">Business Name</label>
                        <input value={editForm.business_name} onChange={e => setEditForm({...editForm, business_name: e.target.value})} placeholder="Override global name..." className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1877F2]">Industry</label>
                        <input value={editForm.industry} onChange={e => setEditForm({...editForm, industry: e.target.value})} placeholder="e.g. Local Bakery" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1877F2]">Niche / Target Audience</label>
                        <input value={editForm.niche} onChange={e => setEditForm({...editForm, niche: e.target.value})} placeholder="e.g. Gluten-free enthusiasts" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1877F2]">Page Description / Services</label>
                        <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Describe what this specific page promotes..." className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium h-24 resize-none" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1877F2]">Page Goal</label>
                        <input value={editForm.goal} onChange={e => setEditForm({...editForm, goal: e.target.value})} placeholder="e.g. Drive wedding cake unquiries" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button onClick={() => saveSettings(page.id, page.metadata)} className="btn btn-primary font-bold px-8 py-3 rounded-xl shadow-lg">
                        Save Page Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {pages.length === 0 && !loading && (
              <div className="col-span-2 p-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                  <Facebook className="w-10 h-10 text-[#1877F2]/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold">No Pages Found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                    We couldn't find any Facebook Pages linked to your account. Make sure you have Page permissions enabled.
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
