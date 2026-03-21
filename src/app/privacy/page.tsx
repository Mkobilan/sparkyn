import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Globe, ChevronRight } from 'lucide-react'

export default function PrivacyPage() {
  const primaryColor = '#f59e0b' // Amber-500
  const successColor = '#10b981' // Emerald-500
  
  return (
    <div className="min-h-screen relative overflow-hidden grain" style={{ backgroundColor: '#0a0a0a', color: '#f5f5f5' }}>
      {/* Ambient glow - Amber */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none -z-10" style={{ background: 'rgba(245, 158, 11, 0.1)' }} />
      {/* Ambient glow - Emerald */}
      <div className="absolute bottom-[-10%] right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none -z-10" style={{ background: 'rgba(16, 185, 129, 0.05)' }} />
      
      {/* Header */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-xl" style={{ borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(10,10,10,0.8)' }}>
        <nav className="container max-w-7xl flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: 'none', color: '#9ca3af' }}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Home</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: 'none' }}>
            <img src="/sparkyn_logo.jpg" alt="Sparkyn Logo" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} className="transition-transform group-hover:scale-110" />
            <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#ffffff' }}>Sparkyn</span>
          </Link>
          <div style={{ width: '64px' }} /> {/* Spacer for balance */}
        </nav>
      </header>

      <main className="container max-w-3xl py-16 px-6 relative z-10">
        {/* Title Section */}
        <div className="space-y-6 mb-20 text-center animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border mx-auto" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', boxShadow: '0 0 40px rgba(245, 158, 11, 0.1)' }}>
            <Shield style={{ color: primaryColor, width: '28px', height: '28px' }} />
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.05em', color: '#ffffff', lineHeight: 1 }}>
            Privacy <span style={{ background: `linear-gradient(135deg, ${primaryColor}, #fbbf24)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Policy</span>
          </h1>
          <div className="flex items-center justify-center gap-2 py-1 px-4 rounded-full w-fit mx-auto border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: primaryColor }} />
            <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af' }}>Effective March 19, 2026</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-16 p-8 rounded-3xl border backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', lineHeight: 1.7, fontSize: '1.125rem', color: '#9ca3af' }}>
          At <span style={{ color: '#ffffff', fontWeight: 700 }}>Sparkyn</span>, your trust is our most valuable asset. We use cutting-edge AI to automate your social presence, but we never compromise on the security of your data or the integrity of your brand.
        </div>

        {/* Content Section */}
        <div className="space-y-16">
          <section className="space-y-6 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors group-hover:bg-opacity-20" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: primaryColor }}>
                <Eye className="w-5 h-5" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>1. Data Collection</h2>
            </div>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#9ca3af' }}>
              To provide our AI-automated social media services, Sparkyn collects your business profile information (industry, goals, description) and social media access tokens when you connect your accounts. We collect only what is necessary to represent your brand accurately in generated content.
            </p>
          </section>

          <section className="space-y-6 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors group-hover:bg-opacity-20" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: successColor }}>
                <Lock className="w-5 h-5" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>2. Data Usage & AI Processing</h2>
            </div>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#9ca3af' }}>
              We use your data strictly to power our automation engine. Your business identifiers help Google Gemini generate high-converting captions, hooks, and CTAs tailored specifically to your niche.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                "AI Content Generation",
                "Automated Scheduling",
                "Cross-Platform Publishing",
                "Content Strategy Analysis"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 rounded-2xl border transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <ChevronRight className="w-3 h-3" style={{ color: primaryColor }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db' }}>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6 p-8 rounded-[2rem] border transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.03)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>3. Security & Encryption</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#9ca3af' }}>
              Encryption is at the core of Sparkyn. Your social media tokens (Facebook, Instagram, TikTok, YouTube) are encrypted and stored in secure environment variables and protected databases. We never share your credentials or internal business data with any third-party marketing firms.
            </p>
          </section>

          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: primaryColor }}>
                <Globe className="w-5 h-5" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>4. Integrated Partners</h2>
            </div>
            <div className="space-y-3">
              {[
                { name: "Meta Developers", role: "Publishing to Facebook & Instagram" },
                { name: "TikTok for Developers", role: "Direct Video Uploading & Scheduling" },
                { name: "Google Cloud / YouTube API", role: "Shorts Distribution" },
                { name: "Google Gemini AI", role: "Natural Language Processing" }
              ].map((partner) => (
                <div key={partner.name} className="flex items-center justify-between p-5 rounded-2xl border transition-all group" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div>
                    <p style={{ fontWeight: 800, color: '#ffffff' }}>{partner.name}</p>
                    <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px', color: '#6b7280' }}>{partner.role}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: 'rgba(255,255,255,0.1)' }} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer link */}
      <footer className="py-12 border-t" style={{ borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
        <div className="container text-center space-y-4">
          <Link href="/terms" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: primaryColor, textDecoration: 'none' }}>
            Terms of Service
          </Link>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>© 2026 Sparkyn Automation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
