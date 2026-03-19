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

export default function YoutubeDashboard() {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
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
      setChannels(prev => prev.map(a => a.id === accountId ? { ...a, content_strategy: strategy } : a))
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-white">
      <Sidebar />
      
      <main className="main-content flex-1 p-8 bg-gradient relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF0000]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4">
                <div className="p-3 bg-[#FF0000]/10 rounded-2xl border border-[#FF0000]/20">
                  <Youtube className="w-10 h-10 text-[#FF0000]" />
                </div>
                YouTube Channels
              </h1>
              <p className="text-muted-foreground font-medium max-w-md">
                Manage your YouTube channels, coordinate Shorts strategy, and automate video descriptions.
              </p>
            </div>
            <div className="flex gap-4">
               <button 
                onClick={() => fetchChannels()}
                className="btn btn-outline h-14 w-14 p-0 rounded-2xl border-border/50"
              >
                <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/dashboard/connect" className="btn btn-primary h-14 px-8 rounded-2xl font-bold gap-3 shadow-lg">
                <Plus className="w-5 h-5" /> Link Channel
              </Link>
            </div>
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {channels.map((channel) => (
              <div key={channel.id} className="card p-8 space-y-6 hover:border-[#FF0000]/40 transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#FF0000]/5 rounded-full blur-3xl group-hover:bg-[#FF0000]/10 transition-all" />
                
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                      <Play className="w-8 h-8 text-[#FF0000]" fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl group-hover:text-[#FF0000] transition-colors">{channel.platform_name || 'YouTube Channel'}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Main Channel</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${channel.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}`}>
                    {channel.is_active ? 'Active' : 'Paused'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tube Strategy</label>
                    <select 
                      value={channel.content_strategy}
                      onChange={(e) => updateStrategy(channel.id, e.target.value)}
                      className="w-full bg-muted border-border font-bold text-sm h-12 rounded-xl focus:ring-[#FF0000] appearance-none cursor-pointer"
                    >
                      <option>Balanced</option>
                      <option>Educational</option>
                      <option>Documentary</option>
                      <option>Reaction</option>
                      <option>Shorts-Only</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shorts Target</label>
                    <div className="h-12 bg-muted rounded-xl flex items-center px-4 font-bold text-sm border border-border/50">
                      2 Videos / Week
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleGenerate(channel.id)}
                    disabled={isGenerating}
                    className="flex-1 btn btn-outline border-[#FF0000]/20 hover:bg-[#FF0000]/10 text-[#FF0000] font-bold gap-2 py-4 rounded-xl"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Shorts
                  </button>
                  <button className="btn btn-ghost w-14 h-14 p-0 rounded-xl border border-border/50">
                    <Settings2 className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
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
      </main>
    </div>
  )
}
