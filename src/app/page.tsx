import Link from 'next/link'
import { Sparkles, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient overflow-hidden">
      {/* Hero Section */}
      <nav className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary w-8 h-8" />
          <span className="text-2xl font-bold tracking-tighter">Sparkyn</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="btn btn-secondary text-sm">Login</Link>
          <Link href="/signup" className="btn btn-primary text-sm px-6">Get Started</Link>
        </div>
      </nav>

      <main className="container pt-20 pb-32 text-center space-y-12">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-pulse">
            <Zap className="w-3 h-3 text-primary" /> Powered by Gemini AI
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
            Automate Your <span className="text-primary italic">Socials</span> While You Sleep.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sparkyn uses advanced AI to generate, design, and schedule high-converting content across Facebook, Instagram, TikTok, and YouTube — daily, on autopilot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup" className="btn btn-primary h-14 px-8 text-lg gap-2 shadow-2xl shadow-primary/30 group">
              Start Automating Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 text-left">
          <div className="glass card p-8 space-y-4 border-primary/10">
            <div className="p-3 bg-primary/20 rounded-2xl w-fit">
              <Zap className="text-primary w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold">AI Brain</h3>
            <p className="text-muted-foreground">Gemini Pro generates high-converting captions, hooks, and CTAs tailored to your specific business niche.</p>
          </div>
          <div className="glass card p-8 space-y-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl w-fit">
              <Globe className="text-blue-500 w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold">Omni-Channel</h3>
            <p className="text-muted-foreground">One setup, multiple platforms. Auto-post to Facebook Pages, Instagram, TikTok, and YouTube Shorts.</p>
          </div>
          <div className="glass card p-8 space-y-4">
            <div className="p-3 bg-green-500/20 rounded-2xl w-fit">
              <ShieldCheck className="text-green-500 w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold">Autopilot</h3>
            <p className="text-muted-foreground">Turn on the scheduler and watch your business grow. No Manual intervention required after onboarding.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
