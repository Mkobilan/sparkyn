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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 space-y-8 overflow-y-auto bg-gradient relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex justify-between items-end border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Automation</p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Content Queue</h1>
            <p className="text-muted-foreground mt-1">Manage all your upcoming automated social media posts.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search posts..." className="input pl-10 h-10 text-sm w-64" />
            </div>
            <button className="btn btn-outline h-10 gap-2">
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
          <div className="space-y-4">
            {queue.map((post) => (
              <div key={post.id} className="card flex gap-6 p-4 items-center group">
                <div className="relative w-40 h-40 rounded-xl overflow-hidden shrink-0 border border-border bg-muted">
                  {post.image_url ? (
                    <img src={post.image_url} alt="Post preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-card">
                      <Plus className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <button className="btn btn-primary w-full h-8 text-[10px] uppercase font-bold tracking-widest gap-1">
                      Quick Edit <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(post.scheduled_at).toLocaleDateString()} at {new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex gap-1.5">
                      {post.platforms.map((p: string) => (
                        <span key={p} className="px-2 py-0.5 rounded-md border border-border bg-muted text-[9px] uppercase font-heavy tracking-tighter text-muted-foreground">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">Post Caption Draft</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 italic">
                      &quot;{post.caption}&quot;
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">AI</div>
                      <div className="w-7 h-7 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">S</div>
                    </div>
                    <span className="text-xs text-muted-foreground">Generated by Gemini Pro & Sparkyn Engine</span>
                  </div>
                </div>
                
                <button className="w-10 h-10 rounded-full hover:bg-accent flex items-center justify-center transition-colors group-hover:translate-x-1 duration-300">
                  <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center border-2 border-dashed border-border rounded-[2rem] bg-card/10">
            <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Your queue is empty</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">Click &quot;Generate Now&quot; on the dashboard or update your schedule in Settings to start automating.</p>
            </div>
            <Link href="/dashboard" className="btn btn-primary gap-2">
              Back to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
