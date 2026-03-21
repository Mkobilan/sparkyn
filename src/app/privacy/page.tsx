import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Globe, Mail, ChevronRight } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient relative overflow-hidden grain">
      {/* Ambient glow - Amber */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      {/* Ambient glow - Success/Emerald */}
      <div className="absolute bottom-[-10%] right-0 w-[400px] h-[400px] bg-success/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <nav className="container max-w-7xl flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest font-heading">Home</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/sparkyn_logo.jpg" alt="Sparkyn Logo" className="w-6 h-6 rounded-sm transition-transform group-hover:scale-110" />
            <span className="text-xl font-black font-heading tracking-tighter text-white">Sparkyn</span>
          </Link>
          <div className="w-16" /> {/* Spacer for balance */}
        </nav>
      </header>

      <main className="container max-w-3xl py-16 px-6 relative z-10">
        {/* Title Section */}
        <div className="space-y-6 mb-20 text-center animate-fade-in-up">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mx-auto glow-amber">
            <Shield className="text-primary w-7 h-7" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tighter text-white">
            Privacy <span className="glow-text">Policy</span>
          </h1>
          <div className="flex items-center justify-center gap-2 py-1 px-4 bg-white/5 rounded-full w-fit mx-auto border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Effective March 19, 2026</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-16 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm leading-relaxed text-lg text-muted-foreground">
          At <span className="text-white font-bold">Sparkyn</span>, your trust is our most valuable asset. We use cutting-edge AI to automate your social presence, but we never compromise on the security of your data or the integrity of your brand.
        </div>

        {/* Content Section */}
        <div className="space-y-12">
          <section className="space-y-6 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-white tracking-tight">1. Data Collection</h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              To provide our AI-automated social media services, Sparkyn collects your business profile information (industry, goals, description) and social media access tokens when you connect your accounts. We collect only what is necessary to represent your brand accurately in generated content.
            </p>
          </section>

          <section className="space-y-6 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center border border-success/20 text-success transition-colors group-hover:bg-success/20">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-white tracking-tight">2. Data Usage & AI Processing</h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              We use your data strictly to power our automation engine. Your business identifiers help Google Gemini generate high-converting captions, hooks, and CTAs tailored specifically to your niche.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                "AI Content Generation",
                "Automated Scheduling",
                "Cross-Platform Publishing",
                "Content Strategy Analysis"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 text-sm font-semibold text-foreground/80 hover:border-primary/30 hover:bg-white/10 transition-all">
                  <ChevronRight className="w-3 h-3 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6 bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
            <h2 className="text-2xl font-bold font-heading text-white tracking-tight">3. Security & Encryption</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Encryption is at the core of Sparkyn. Your social media tokens (Facebook, Instagram, TikTok, YouTube) are encrypted and stored in secure environment variables and protected databases. We never share your credentials or internal business data with any third-party marketing firms.
            </p>
          </section>

          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-white tracking-tight">4. Integrated Partners</h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Sparkyn communicates with the following platforms to fulfill its automation duties:
            </p>
            <div className="space-y-3">
              {[
                { name: "Meta Developers", role: "Publishing to Facebook & Instagram", color: "text-blue-400" },
                { name: "TikTok for Developers", role: "Direct Video Uploading & Scheduling", color: "text-rose-400" },
                { name: "Google Cloud / YouTube API", role: "Shorts Distribution", color: "text-red-400" },
                { name: "Google Gemini AI", role: "Natural Language Processing", color: "text-primary" }
              ].map((partner) => (
                <div key={partner.name} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                  <div>
                    <p className="font-bold text-white group-hover:text-primary transition-colors">{partner.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mt-1">{partner.role}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              ))}
            </div>
          </section>

          <section className="text-center pt-20 pb-20 border-t border-white/10">
            <h2 className="text-xl font-bold font-heading text-white mb-4">Questions about your data?</h2>
            <p className="text-sm text-muted-foreground mb-10">Contact our security team for any inquiries regarding your privacy.</p>
            <a href="mailto:support@sparkyn.ai" className="btn btn-primary gap-2 py-4 px-10 rounded-2xl glow-amber font-bold">
              <Mail className="w-4 h-4" /> support@sparkyn.ai
            </a>
          </section>
        </div>
      </main>

      {/* Footer link */}
      <footer className="py-12 border-t border-white/5 bg-white/[0.02]">
        <div className="container text-center space-y-4">
          <Link href="/terms" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
            View Terms of Service
          </Link>
          <p className="text-[10px] text-white/20">© 2026 Sparkyn Automation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
