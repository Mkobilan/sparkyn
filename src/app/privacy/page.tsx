import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Globe, Mail } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden grain">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <nav className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest font-heading">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-3">
            <img src="/sparkyn_logo.jpg" alt="Sparkyn Logo" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-extrabold font-heading tracking-tight text-white">Sparkyn</span>
          </Link>
          <div className="w-20" /> {/* Spacer for balance */}
        </nav>
      </header>

      <main className="container max-w-4xl py-20 px-6">
        {/* Title Section */}
        <div className="space-y-6 mb-16 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mx-auto">
            <Shield className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-5xl font-black font-heading tracking-tighter text-white">Privacy Policy</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary/40" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Effective March 19, 2026</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-16 text-muted-foreground leading-relaxed">
          <section className="space-y-6 bg-card/30 p-8 rounded-[2rem] border border-border/50 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-white tracking-tight">1. Data Collection</h2>
            </div>
            <p className="text-lg">
              To provide our AI-automated social media services, Sparkyn collects your business profile information (industry, goals, description) and social media access tokens when you connect your accounts. We collect only what is necessary to represent your brand accurately in generated content.
            </p>
          </section>

          <section className="space-y-6 p-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-white tracking-tight">2. Data Usage & AI Processing</h2>
            </div>
            <p className="text-lg">
              We use your data strictly to power our automation engine. Your business identifiers help Google Gemini generate high-converting captions, hooks, and CTAs tailored specifically to your niche.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                "AI Content Generation",
                "Automated Scheduling",
                "Cross-Platform Publishing",
                "Content Strategy Analysis"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 bg-muted/20 rounded-xl border border-border/50 text-sm font-bold text-foreground overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6 bg-card/30 p-8 rounded-[2rem] border border-border/50">
            <h2 className="text-2xl font-bold font-heading text-white tracking-tight">3. Security & Encryption</h2>
            <p className="text-lg">
              Encryption is at the core of Sparkyn. Your social media tokens (Facebook, Instagram, TikTok, YouTube) are encrypted and stored in secure environment variables and protected databases. We never share your credentials or internal business data with any third-party marketing firms.
            </p>
          </section>

          <section className="space-y-8 p-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-white tracking-tight">4. Integrated Partners</h2>
            </div>
            <p className="text-lg">
              Sparkyn communicates with the following platforms to fulfill its automation duties:
            </p>
            <div className="space-y-3">
              {[
                { name: "Meta Developers", role: "Publishing to Facebook & Instagram" },
                { name: "TikTok for Developers", role: "Direct Video Uploading & Scheduling" },
                { name: "Google Cloud / YouTube API", role: "Shorts Distribution" },
                { name: "Google Gemini AI", role: "Natural Language Processing" }
              ].map((partner) => (
                <div key={partner.name} className="flex items-center justify-between p-5 bg-muted/10 rounded-2xl border border-border/40">
                  <div>
                    <p className="font-bold text-white">{partner.name}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{partner.role}</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-primary opacity-40" />
                </div>
              ))}
            </div>
          </section>

          <section className="text-center pt-10 pb-20 border-t border-border/50">
            <h2 className="text-xl font-bold font-heading text-white mb-4">Questions about your data?</h2>
            <p className="text-sm mb-8">Contact our security team for any inquiries regarding your privacy.</p>
            <a href="mailto:support@sparkyn.ai" className="btn btn-outline gap-2 py-4 px-8 border-primary/20 hover:border-primary text-primary font-bold">
              <Mail className="w-4 h-4" /> support@sparkyn.ai
            </a>
          </section>
        </div>
      </main>

      {/* Footer link */}
      <footer className="py-12 border-t border-border/50 bg-card/20">
        <div className="container text-center">
          <Link href="/terms" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            View Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  )
}
