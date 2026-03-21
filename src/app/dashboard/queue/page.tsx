'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { 
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Plus,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'

export default function QueuePage() {
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchQueue = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })

      if (!error) {
        setQueue(data || [])
      }
      setLoading(false)
    }

    fetchQueue()
  }, [supabase])

  return (
    <main className="main-content bg-gradient relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex justify-between items-end border-b border-border/50 pb-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Automated Engine</p>
            </div>
            <h1 className="text-5xl font-black tracking-tighter font-heading text-white">Content Queue</h1>
            <p className="text-muted-foreground text-lg mt-2 opacity-80">Manage all your upcoming automated social media posts.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search posts..." className="input pl-12 h-14 text-sm w-72 rounded-2xl border-border/50 bg-muted/20 focus:bg-muted/40 transition-all shadow-inner" />
            </div>
            <button className="btn btn-outline h-14 px-6 gap-2 rounded-2xl font-black uppercase text-[10px] tracking-widest border-border/50 hover:border-primary/30">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Queue Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Loading your queue...</p>
          </div>
        ) : queue.length > 0 ? (
          <div className="space-y-6">
            {queue.map((post) => (
              <div key={post.id} className="card-premium flex gap-10 p-8 items-center group relative hover:border-primary/20 transition-all">
                <div className="relative w-48 h-48 rounded-[1.5rem] overflow-hidden shrink-0 border border-border bg-muted shadow-2xl">
                  {post.image_url ? (
                    <img src={post.image_url} alt="Post preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-card">
                      <Plus className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button className="btn btn-primary w-full h-10 text-[10px] uppercase font-black tracking-[0.15em] gap-2 rounded-xl shadow-lg">
                      Quick Edit <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full uppercase tracking-widest">
                      <Clock className="w-4 h-4" />
                      {new Date(post.scheduled_at).toLocaleDateString()} at {new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex gap-2">
                      {post.platforms.map((p: string) => (
                        <span key={p} className="px-3 py-1.5 rounded-xl border border-border bg-muted/30 text-[9px] uppercase font-black tracking-widest text-muted-foreground">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-black text-2xl group-hover:text-primary transition-colors line-clamp-1 tracking-tight">Post Caption Draft</h3>
                    <p className="text-base text-muted-foreground leading-relaxed line-clamp-2 italic opacity-80">
                      &quot;{post.caption}&quot;
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        <div className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-black shadow-lg">AI</div>
                        <div className="w-9 h-9 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary shadow-lg">S</div>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground opacity-60">Generated by Gemini Pro & Sparkyn Engine</span>
                    </div>
                    <div className="badge bg-muted/50 border border-border text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                      Ready to fire
                    </div>
                  </div>
                </div>
                
                <button className="w-14 h-14 rounded-2xl bg-muted/20 border border-border flex items-center justify-center transition-all group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:translate-x-1">
                  <ChevronRight className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 space-y-8 text-center border-2 border-dashed border-border/50 rounded-[3rem] bg-card/5 backdrop-blur-sm">
            <div className="w-24 h-24 rounded-[2rem] bg-muted/30 flex items-center justify-center border border-border/50 rotate-3 group-hover:rotate-0 transition-transform">
              <Calendar className="w-12 h-12 text-muted-foreground/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Your queue is empty</h3>
              <p className="text-muted-foreground max-w-sm mx-auto font-medium opacity-70">Click &quot;Generate Now&quot; on the dashboard or update your schedule in Settings to start automating.</p>
            </div>
            <Link href="/dashboard" className="btn btn-primary h-14 px-10 rounded-2xl font-black gap-3 shadow-xl">
              Back to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
    </main>
  )
}
