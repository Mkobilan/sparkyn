'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Calendar,
  Layers,
  BarChart3,
  ChevronRight,
  Loader2,
  Sparkles,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [queue, setQueue] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progressMsg, setProgressMsg] = useState<string | null>(null)
  const [lastResults, setLastResults] = useState<any>(null)
  const supabase = createClient()

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    setProfile(profileData)

    // Fetch real queue data
    const { data: queueData } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(3)
    
    setQueue(queueData || [])

    // Fetch real recent activity (published or failed posts)
    const { data: activityData } = await supabase
      .from('scheduled_posts')
      .select('*')
      .neq('status', 'scheduled')
      .order('updated_at', { ascending: false })
      .limit(4)
    
    setRecentActivity(activityData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setProgressMsg("Step 1/3: Writing AI Scripts for all platforms...")
    try {
      // ── WATERFALL STEP 1: GENERATE CONTENT ──
      const genRes = await fetch('/api/generate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishNow: true }) 
      })
      if (!genRes.ok) throw new Error(`[Script Gen] ${await genRes.text()}`);
      const genData = await genRes.json();
      const posts = genData.posts || [];
      if (posts.length === 0) {
        alert("No content was generated. Check your connected accounts.");
        return;
      }

      // ── WATERFALL STEP 2: GENERATE MEDIA FOR EACH POST ──
      for (const post of posts) {
        setProgressMsg(`Step 2/3: Compiling Media for ${post.platform}...`)
        const mediaRes = await fetch('/api/generate/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });
        if (!mediaRes.ok) console.error(`[Media Gen] Failed for ${post.id}:`, await mediaRes.text());
        
        // ── WATERFALL STEP 3: PUBLISH NOW ──
        setProgressMsg(`Step 3/3: Publishing ${post.platform} live...`)
        const pubRes = await fetch('/api/publish/now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });
        if (!pubRes.ok) console.error(`[Publish] Failed for ${post.id}:`, await pubRes.text());
      }

      setLastResults({ success: true, posts });
      fetchDashboardData();
    } catch (error: any) {
      console.error("Main Dashboard Waterfall Error:", error)
      const isTimeout = error.message?.includes('504') || error.message?.includes('timeout');
      alert(isTimeout 
        ? 'The request timed out. High traffic on AI models—please try again.'
        : `Waterfall Failure: ${error.message}`);
    } finally {
      setIsGenerating(false)
      setProgressMsg(null)
    }
  }

  const stats = [
    { name: 'Published', value: profile?.total_posts || '0', icon: CheckCircle2, color: 'text-success' },
    { name: 'Scheduled', value: queue.length.toString(), icon: Clock, color: 'text-primary' },
    { name: 'Connected', value: profile?.platforms?.length || '0', icon: Layers, color: 'text-success' },
  ]

  return (
    <main className="main-content bg-gradient relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Header */}
        <div className="card-premium p-10 rounded-[2.5rem] mb-10 border-primary/20 bg-primary/5 shadow-[0_0_50px_-12px_hsla(var(--primary),0.2)] backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-700" />
          <div className="flex justify-between items-center relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <span className="badge bg-success/10 text-success border border-success/20 py-1.5 px-4 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse mr-1" />
                  <TrendingUp className="w-3 h-3 mr-1" /> System Online
                </span>
                {profile?.subscription_tier && (
                  <span className="badge bg-primary/10 text-primary border border-primary/20 py-1.5 px-4 rounded-full font-black uppercase tracking-widest text-[10px]">
                    {profile.subscription_tier} Tier
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-black tracking-tighter font-heading text-white">
                {profile?.business_name ? `Grow, ${profile.business_name}` : 'Welcome back, Grower!'}
              </h1>
              <p className="text-muted-foreground text-lg font-medium opacity-80">Your content engine is currently active and processing daily.</p>
            </div>
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="btn btn-primary h-16 px-10 text-lg font-black gap-3 shadow-[0_0_40px_-5px_hsla(var(--primary),0.5)] transition-all hover:scale-105 active:scale-95 rounded-2xl"
            >
              {isGenerating ? <Loader2 className="w-7 h-7 animate-spin" /> : <div className="p-2 bg-black/10 rounded-xl"><Plus className="w-6 h-6" /></div>}
              {isGenerating ? 'Firing AI...' : 'Generate Content'}
            </button>
          </div>
        </div>
        {progressMsg && (
          <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#0f0f0f] border border-primary/30 p-10 rounded-[2.5rem] max-w-md w-full shadow-[0_0_100px_rgba(var(--primary),0.2)] text-center space-y-6 animate-in zoom-in duration-300">
              <div className="flex justify-center">
                <div className="relative">
                  <RefreshCw className="w-16 h-16 text-primary animate-spin" />
                  <Zap className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">Waterfall Fire</h3>
                <p className="text-primary font-bold animate-pulse">{progressMsg}</p>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px] mx-auto">
                Processing multi-stage generation to exceed platform timeout limits.
              </p>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {lastResults && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="card max-w-md w-full p-8 space-y-6 shadow-2xl border-primary/20 bg-card/95 relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setLastResults(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-success/10 text-success border border-success/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-heading">
                    {lastResults?.posts?.[0]?.status === 'published' ? '✅ Published!' : lastResults?.posts?.[0]?.status === 'failed' ? '❌ Publishing Failed' : 'Content Created'}
                  </h3>
                  <p className="text-muted-foreground font-medium text-sm">
                    {lastResults?.posts?.[0]?.status === 'published' 
                      ? 'Your post is LIVE!' 
                      : lastResults?.posts?.[0]?.status === 'failed'
                        ? `Error: ${lastResults?.errors?.[0] || 'Unknown error. Check Vercel logs for details.'}`
                        : 'Content has been generated and scheduled.'}
                  </p>
                </div>
              </div>

              {lastResults.publishLinks?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Live Links</p>
                  <div className="space-y-2">
                    {lastResults.publishLinks.map((link: any, i: number) => (
                      <a 
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline border-primary/20 w-full justify-between group hover:border-primary/50 transition-all font-bold"
                      >
                        <span className="flex flex-col items-start gap-0.5">
                          <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            View on {link.platform}
                          </span>
                          {link.channelTitle && (
                            <span className="text-[10px] text-muted-foreground ml-6">
                              Channel: {link.channelTitle}
                            </span>
                          )}
                        </span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {lastResults.debug && !lastResults.publishLinks?.length && (
                <div className="bg-muted/50 p-4 rounded-xl border border-border text-[10px] font-mono space-y-2">
                  <p className="text-muted-foreground uppercase font-bold tracking-widest">Debug Console</p>
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(lastResults.debug, null, 2)}
                  </pre>
                  {lastResults.posts?.length > 0 && (
                    <p className="text-success">
                      Generated {lastResults.posts.length} record(s).
                    </p>
                  )}
                </div>
              )}

              <button 
                onClick={() => setLastResults(null)}
                className="btn btn-primary w-full h-12 font-bold shadow-lg"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat) => (
            <div key={stat.name} className="card-premium p-8 group h-44 hover-glow">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-muted/50 border border-border group-hover:border-primary/30 transition-all duration-300`}>
                  <stat.icon className={`w-7 h-7 ${stat.color} transition-all group-hover:scale-110`} />
                </div>
                <div className="w-2 h-2 rounded-full bg-border group-hover:bg-primary transition-colors duration-500" />
              </div>
              <div>
                <h3 className="text-4xl font-black font-heading text-white">{stat.value}</h3>
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{stat.name}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Queue */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold flex items-center gap-3 font-heading">
                <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20"><Calendar className="text-primary w-5 h-5" /></div> Content Queue
              </h2>
              <Link href="/dashboard/queue" className="btn btn-ghost text-xs font-bold gap-1 uppercase tracking-widest">
                Explore Full Queue <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {queue.map((post) => (
                <div key={post.id} className="card-premium p-6 flex gap-8 items-center group hover:border-primary/20 transition-all">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 border border-border bg-muted relative">
                    <img src={post.image_url} alt="Post preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        {new Date(post.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-extrabold text-xl line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{post.caption}</p>
                    <div className="flex gap-2">
                      {post.platforms.map((p: string) => (
                        <span key={p} className="px-2.5 py-1 rounded-lg border border-border bg-muted/30 text-[9px] uppercase font-black tracking-widest text-muted-foreground">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-muted/50 border border-border opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                    <ChevronRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              ))}
              {queue.length === 0 && !loading && (
                <div className="p-16 text-center border-2 border-dashed border-border rounded-[2rem] bg-muted/5 space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-muted-foreground">Your queue is empty</p>
                    <p className="text-sm text-muted-foreground/60">Click &quot;Generate New Content&quot; to bring your feed to life.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Column */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold flex items-center gap-3 font-heading">
                <div className="p-1.5 bg-success/10 rounded-lg border border-success/20"><BarChart3 className="text-success w-5 h-5" /></div> Activity
              </h2>
              <div className="card p-0 overflow-hidden divide-y divide-border/50">
                {recentActivity.map((item) => (
                  <div key={item.id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-bold line-clamp-1">{item.caption || 'AI Generated Post'}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      item.status === 'published' 
                        ? 'bg-success/10 text-success border-success/20' 
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
                {recentActivity.length === 0 && !loading && (
                  <div className="p-10 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-primary/10 to-success/5 border-primary/20 space-y-5 p-8 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
              <h4 className="font-extrabold flex items-center gap-2 text-lg">
                <Sparkles className="text-primary w-5 h-5" /> Insights
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {profile?.onboarding_completed 
                  ? "Your engine is currently analyzing your industry performance. Check back in 24h for detailed suggestions."
                  : "Complete your profile setup to let our AI build your personalized content strategy."}
              </p>
              <button className="btn btn-outline border-primary/30 w-full text-xs py-3 font-bold uppercase tracking-widest hover:bg-primary/5 transition-all">
                Learn More
              </button>
            </div>
          </div>
        </div>
    </main>
  )
}
