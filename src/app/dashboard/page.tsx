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
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [queue, setQueue] = useState<any[]>([])
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)

      // Dummy data for now (will be replaced by AI integration later)
      setQueue([
        { 
          id: '1', 
          platforms: ['facebook', 'instagram'], 
          caption: "Unlock the power of automation with Sparkyn!", 
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop"
        },
        { 
          id: '2', 
          platforms: ['tiktok'], 
          caption: "How we scaled our SaaS in 30 days. No fluff.", 
          scheduled_at: new Date(Date.now() + 172800000).toISOString(),
          image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop"
        }
      ])
    }

    fetchData()
  }, [supabase])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        // Refresh queue
        const { data: queueData } = await supabase
          .from('scheduled_posts')
          .select('*')
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true })
        setQueue(queueData || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const stats = [
    { name: 'Published Today', value: '0', icon: CheckCircle2, color: 'text-green-500' },
    { name: 'Scheduled', value: queue.length.toString(), icon: Clock, color: 'text-blue-500' },
    { name: 'Connected Platforms', value: profile?.platforms?.length || '0', icon: Layers, color: 'text-purple-500' },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.business_name || 'Grower'}!</h1>
            <p className="text-muted-foreground mt-1">Here is what&apos;s happening with your socials today.</p>
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="btn btn-primary gap-2 shadow-xl shadow-primary/20"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {isGenerating ? 'Generating...' : 'Generate Now'}
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="glass card flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-background border border-border`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Queue */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-primary w-5 h-5" /> Content Queue
              </h2>
              <button className="text-sm text-primary font-semibold hover:underline">View All</button>
            </div>

            <div className="space-y-4">
              {queue.map((post) => (
                <div key={post.id} className="glass card flex gap-6 p-4 items-center group">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden shrink-0 border border-border">
                    <img src={post.image_url} alt="Post preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" /> {new Date(post.scheduled_at).toLocaleString()}
                    </div>
                    <p className="font-medium line-clamp-2 mb-3">{post.caption}</p>
                    <div className="flex gap-2">
                      {post.platforms.map((p: string) => (
                        <span key={p} className="px-2 py-1 rounded bg-secondary text-[10px] uppercase font-bold tracking-wider">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {queue.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground">No posts scheduled. Click &quot;Generate Now&quot; to start!</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity / Insights Card */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="text-primary w-5 h-5" /> Recent Activity
            </h2>
            <div className="glass card divide-y divide-border p-0">
              {[
                { label: 'Facebook Post', status: 'Published', time: '2 hours ago' },
                { label: 'Instagram Reel', status: 'Published', time: '5 hours ago' },
                { label: 'TikTok Video', status: 'Failed', time: 'Yesterday' },
              ].map((item, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    item.status === 'Published' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="glass card bg-primary/10 border-primary/20 space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <Sparkles className="text-primary w-4 h-4" /> AI Suggestion
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your educational posts are getting 40% more engagement on LinkedIn. Should we generate more of those?
              </p>
              <button className="btn btn-secondary w-full text-xs py-2">Try it now</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
