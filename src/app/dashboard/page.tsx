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
    try {
      const response = await fetch('/api/generate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishNow: true }) 
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown server error');
        const isTimeout = response.status === 504 || response.status === 408;
        alert(isTimeout 
          ? 'The request timed out. Video generation takes time — try again or schedule it instead.' 
          : `Server error (${response.status}): ${errorText.slice(0, 200)}`);
        return;
      }
      const data = await response.json()
      if (data.success) {
        setLastResults(data);
        fetchDashboardData()
      } else {
        alert("Generation failed: " + data.error);
      }
    } catch (error: any) {
      console.error(error)
      alert("System Error: " + (error.message || "The server timed out or failed. Check your connection or upgrade Vercel limits."));
    } finally {
      setIsGenerating(false)
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
        <div className="flex justify-between items-center bg-card/30 p-8 rounded-[2rem] border border-border shadow-2xl backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-success/10 text-success border border-success/20">
                <TrendingUp className="w-3 h-3" /> System Online
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight font-heading">
              {profile?.business_name ? `Grow, ${profile.business_name}` : 'Welcome back, Grower!'}
            </h1>
            <p className="text-muted-foreground font-medium">Your engine is primed and content is being generated daily.</p>
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="btn btn-primary h-14 px-8 text-md font-bold gap-3 shadow-[0_0_30px_-5px_hsla(var(--primary),0.4)] transition-all hover:scale-105 active:scale-95"
          >
            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="p-1.5 bg-black/10 rounded-lg"><Plus className="w-5 h-5" /></div>}
            {isGenerating ? 'Firing AI...' : 'Generate New Content'}
          </button>
        </div>

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
                  <h3 className="text-2xl font-black font-heading">Content Priming...</h3>
                  <p className="text-muted-foreground font-medium text-sm">
                    {lastResults?.posts?.[0]?.status === 'published' 
                      ? 'Your post is LIVE!' 
                      : 'AI is generating your media in the background. Your post will be live in 1-2 minutes.'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="card p-6 flex flex-col justify-between group h-40">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl bg-muted/50 border border-border group-hover:border-primary/30 transition-colors`}>
                  <stat.icon className={`w-6 h-6 ${stat.color} transition-all group-hover:scale-110`} />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
              </div>
              <div>
                <h3 className="text-3xl font-black mt-2 font-heading">{stat.value}</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.name}</p>
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

            <div className="grid grid-cols-1 gap-4">
              {queue.map((post) => (
                <div key={post.id} className="card p-4 flex gap-6 items-center group relative overflow-hidden">
                  <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 border border-border bg-muted">
                    <img src={post.image_url} alt="Post preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/10">
                        {new Date(post.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{post.caption}</p>
                    <div className="flex gap-1.5">
                      {post.platforms.map((p: string) => (
                        <span key={p} className="px-2 py-0.5 rounded-md border border-border bg-muted/30 text-[9px] uppercase font-heavy tracking-tighter">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
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
