'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { 
  Youtube, 
  Settings2, 
  Plus, 
  Calendar,
  Layers,
  BarChart3,
  ChevronRight,
  Loader2,
  Sparkles,
  RefreshCw,
  Play
} from 'lucide-react'
import Link from 'next/link'
import ErrorModal from '@/components/ErrorModal'

export default function YoutubeDashboard() {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [progressMsg, setProgressMsg] = useState<string | null>(null)
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string; details?: any }>({ isOpen: false, message: '' })
  const [scheduledTimes, setScheduledTimes] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ business_name: '', industry: '', niche: '', description: '', goal: '' })
  const supabase = createClient()

  const fetchChannels = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'youtube')
    
    setChannels(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const handleGenerate = async (accountId: string, publishNow: boolean = false) => {
    setGeneratingId(accountId)
    setProgressMsg("Step 1/3: Writing AI Script...")
    try {
      const scheduledAt = scheduledTimes[accountId]
      const isVideo = true; // Always true for YouTube Shorts

      // ── WATERFALL STEP 1: GENERATE CONTENT ──
      const genRes = await fetch('/api/generate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, scheduledAt, isVideo })
      })
      if (!genRes.ok) throw new Error(`[Script Gen] ${await genRes.text()}`);
      const genData = await genRes.json();
      const postId = genData.posts?.[0]?.id;
      if (!postId) throw new Error("No Post ID returned from generation.");

      // ── WATERFALL STEP 2: GENERATE AI IMAGE ──
      setProgressMsg("Step 2/5: Generating AI Imagery...")
      const imgRes = await fetch('/api/generate/media/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      })
      if (!imgRes.ok) throw new Error(`[Image Gen] ${await imgRes.text()}`);

      // ── WATERFALL STEP 3: GENERATE AUDIO (VIDEO ONLY) ──
      if (isVideo) {
        setProgressMsg("Step 3/5: Vocalizing Video Script...")
        const audRes = await fetch('/api/generate/media/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
        })
        if (!audRes.ok) throw new Error(`[Audio Gen] ${await audRes.text()}`);
      }

      // ── WATERFALL STEP 4: FINAL COMPILATION ──
      setProgressMsg(isVideo ? "Step 4/5: Compiling Final Video..." : "Step 4/5: Finalizing Media Assets...")
      const compileRes = await fetch('/api/generate/media/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      })
      if (!compileRes.ok) throw new Error(`[Compilation] ${await compileRes.text()}`);
      
      // ── WATERFALL STEP 5: PUBLISH NOW (IF REQUESTED) ──
      if (publishNow) {
        setProgressMsg("Step 5/5: Posting live to YouTube...")
        const pubRes = await fetch('/api/publish/now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
        })
        if (!pubRes.ok) throw new Error(`[Publish] ${await pubRes.text()}`);
        setErrorModal({ isOpen: true, message: '✅ YouTube Short published successfully!' })
      } else {
        setErrorModal({ isOpen: true, message: '📅 Short generated and scheduled!' })
      }

      fetchChannels()
    } catch (error: any) {
      console.error("YouTube Waterfall Error:", error)
      const isTimeout = error.message?.includes('504') || error.message?.includes('timeout');
      setErrorModal({ 
        isOpen: true, 
        message: isTimeout 
          ? 'The request timed out. Video generation takes time — try again or schedule it instead.'
          : `Waterfall Failure: ${error.message}`,
        details: error
      });
    } finally {
      setGeneratingId(null)
      setProgressMsg(null)
    }
  }

  const updateStrategy = async (accountId: string, strategy: string) => {
    const { error } = await supabase
      .from('social_accounts')
      .update({ content_strategy: strategy })
      .eq('id', accountId)
    
    if (!error) {
      setChannels(prev => prev.map(a => a.id === accountId ? { ...a, content_strategy: strategy } : a))
    } else {
      console.error('Update Strategy Error:', error)
      alert(`Failed to update strategy: ${error.message}`)
    }
  }

  const handleEditClick = (channel: any) => {
    if (editingId === channel.id) {
      setEditingId(null)
    } else {
      setEditingId(channel.id)
      setEditForm({
        business_name: channel.metadata?.business_name || '',
        industry: channel.metadata?.industry || '',
        niche: channel.metadata?.niche || '',
        description: channel.metadata?.description || '',
        goal: channel.metadata?.goal || ''
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
      setChannels(prev => prev.map(a => a.id === accountId ? { ...a, metadata: newMetadata } : a))
      setEditingId(null)
      alert('Channel settings saved!')
    } else {
      alert(`Failed to save settings: ${error.message}`)
    }
  }
      
  return (
    <div className="text-white relative">

      {progressMsg && (
        <div className="fixed inset-0 bg-[#000000]/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0f0f0f] border border-[#FF0000]/30 p-10 rounded-[2.5rem] max-w-md w-full shadow-[0_0_80px_rgba(255,0,0,0.2)] text-center space-y-6">
            <div className="flex justify-center">
              <RefreshCw className="w-16 h-16 text-[#FF0000] animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Processing YouTube Waterfall</h3>
              <p className="text-[#FF0000] font-bold animate-pulse">{progressMsg}</p>
            </div>
            <p className="text-muted-foreground text-xs px-4 leading-relaxed">
              Splitting request into stages to prevent timeouts. Please don't close this window.
            </p>
          </div>
        </div>
      )}
      
      <main className="main-content flex-1 p-8 bg-gradient relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF0000]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-end mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#FF0000]/10 rounded-2xl border border-[#FF0000]/20 shadow-[0_0_30px_-5px_#FF000033]">
                  <Youtube className="w-12 h-12 text-[#FF0000]" />
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tighter font-heading text-white">YouTube Channels</h1>
                  <p className="text-muted-foreground text-lg font-medium opacity-80 mt-1">Manage, optimize, and automate your YouTube Shorts presence.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
               <button 
                onClick={() => fetchChannels()}
                className="btn btn-outline h-16 w-16 p-0 rounded-2xl border-border/50 hover:border-[#FF0000]/30 transition-all"
              >
                <RefreshCw className={`w-7 h-7 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/dashboard/connect" className="btn btn-primary h-16 px-10 rounded-2xl font-black gap-3 shadow-[0_10px_30px_-5px_hsla(var(--primary),0.5)] text-lg">
                <Plus className="w-6 h-6" /> Link Channel
              </Link>
            </div>
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {channels.map((channel) => (
              <div key={channel.id} className="card-premium p-10 space-y-8 hover:border-[#FF0000]/40 transition-all group overflow-hidden relative shadow-[0_0_50px_-15px_#FF00001a]">
                <div className="absolute -right-4 -top-4 w-40 h-40 bg-[#FF0000]/5 rounded-full blur-3xl group-hover:bg-[#FF0000]/10 transition-all" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center font-black text-3xl group-hover:scale-110 transition-transform duration-500 overflow-hidden shadow-xl">
                      <Play className="w-10 h-10 text-[#FF0000]" fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-black text-2xl text-white group-hover:text-[#FF0000] transition-colors tracking-tight">{channel.platform_name || 'YouTube Channel'}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Main Channel</p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${channel.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border/50'}`}>
                    {channel.is_active ? 'Active' : 'Paused'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tube Strategy</label>
                    <select 
                      value={channel.content_strategy}
                      onChange={(e) => updateStrategy(channel.id, e.target.value)}
                      className="w-full bg-muted/30 border-border/50 font-black text-[11px] h-14 rounded-2xl focus:ring-[#FF0000] appearance-none cursor-pointer px-5 transition-all hover:bg-muted/50 uppercase tracking-widest text-white"
                    >
                      <option>Balanced</option>
                      <option>Educational</option>
                      <option>Documentary</option>
                      <option>Reaction</option>
                      <option>Shorts-Only</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Schedule</label>
                    <div className="h-14 bg-muted/30 rounded-2xl flex items-center px-5 font-bold text-sm border border-border/50 hover:bg-muted/50 transition-all text-[#FF0000]">
                      <input 
                        type="datetime-local" 
                        value={scheduledTimes[channel.id] || ''}
                        onChange={(e) => setScheduledTimes({ ...scheduledTimes, [channel.id]: e.target.value })}
                        className="bg-transparent border-none outline-none w-full text-white cursor-pointer invert brightness-200"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <button 
                    onClick={() => handleGenerate(channel.id, true)}
                    disabled={!!generatingId}
                    className="flex-1 btn btn-primary bg-[#FF0000] border-[#FF0000] hover:bg-[#FF0000]/90 text-white font-black uppercase tracking-widest text-[11px] gap-2 h-16 rounded-2xl shadow-[0_10px_30px_-5px_#FF000066] transition-all hover:scale-105 active:scale-95"
                  >
                    {generatingId === channel.id ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                    Publish Shorts
                  </button>
                  <button 
                    onClick={() => handleGenerate(channel.id, false)}
                    disabled={!!generatingId}
                    className="flex-1 btn btn-outline border-[#FF0000]/30 hover:bg-[#FF0000]/10 text-[#FF0000] font-black uppercase tracking-widest text-[11px] gap-2 h-16 rounded-2xl transition-all"
                  >
                    Schedule AI
                  </button>
                  <button onClick={() => handleEditClick(channel)} className={`btn w-16 h-16 p-0 rounded-2xl border ${editingId === channel.id ? 'bg-[#FF0000]/20 border-[#FF0000] text-[#FF0000] shadow-lg' : 'btn-ghost border-border/50 text-muted-foreground'} transition-all`}>
                    <Settings2 className="w-7 h-7 cursor-pointer" />
                  </button>
                </div>

                {editingId === channel.id && (
                  <div className="mt-6 p-6 border border-border/50 rounded-2xl bg-muted/20 space-y-4">
                    <h4 className="font-extrabold text-sm uppercase tracking-widest text-muted-foreground mb-4">Channel-Specific Overrides</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000]">Business Name</label>
                        <input value={editForm.business_name} onChange={e => setEditForm({...editForm, business_name: e.target.value})} placeholder="Override global name..." className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000]">Industry</label>
                        <input value={editForm.industry} onChange={e => setEditForm({...editForm, industry: e.target.value})} placeholder="e.g. Local Bakery" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000]">Niche / Target Audience</label>
                        <input value={editForm.niche} onChange={e => setEditForm({...editForm, niche: e.target.value})} placeholder="e.g. Video Editing Tutorials" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000]">Channel Description</label>
                        <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Describe what this specific Channel promotes..." className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium h-24 resize-none" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000]">Goal</label>
                        <input value={editForm.goal} onChange={e => setEditForm({...editForm, goal: e.target.value})} placeholder="e.g. Subscriber growth" className="w-full bg-background border-border/50 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button onClick={() => saveSettings(channel.id, channel.metadata)} className="btn btn-primary bg-[#FF0000] border-[#FF0000] hover:bg-[#FF0000]/90 text-white font-bold px-8 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(255,0,0,0.39)]">
                        Save Channel Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {channels.length === 0 && !loading && (
              <div className="col-span-2 p-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-[#FF0000]/10 flex items-center justify-center">
                  <Youtube className="w-10 h-10 text-[#FF0000]/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold">No Channels Linked</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                    Link your YouTube channel to automate your shorts and long-form growth.
                  </p>
                </div>
                <Link href="/dashboard/connect" className="btn btn-primary px-8 rounded-2xl h-14 font-bold inline-flex">
                  Connect YouTube
                </Link>
              </div>
            )}
          </div>
        </div>
          <ErrorModal 
          isOpen={errorModal.isOpen} 
          onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
          message={errorModal.message}
          errorDetails={errorModal.details}
        />
    </main>
    </div>
  )
}
