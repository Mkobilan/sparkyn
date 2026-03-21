import Link from 'next/link'
import { ArrowLeft, FileText, Scale, ShieldAlert, Zap, HelpCircle, ChevronRight } from 'lucide-react'

export default function TermsPage() {
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
            <FileText style={{ color: primaryColor, width: '28px', height: '28px' }} />
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.05em', color: '#ffffff', lineHeight: 1 }}>
            Terms of <span style={{ background: `linear-gradient(135deg, ${primaryColor}, #fbbf24)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Service</span>
          </h1>
          <div className="flex items-center justify-center gap-2 py-1 px-4 rounded-full w-fit mx-auto border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: primaryColor }} />
            <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af' }}>Effective March 19, 2026</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-12">
          <section className="space-y-6 group p-8 rounded-3xl border transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors group-hover:bg-opacity-20" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: primaryColor }}>
                <Scale className="w-5 h-5" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>1. Acceptance</h2>
            </div>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#9ca3af' }}>
              By accessing and using Sparkyn, you agree to be bound by these Terms of Service. Sparkyn provides automated social media marketing tools powered by proprietary AI engines and Google Gemini.
            </p>
          </section>

          <section className="space-y-6 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors group-hover:bg-opacity-20" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: successColor }}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>2. User Responsibility</h2>
            </div>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#9ca3af' }}>
              As a content creator or business owner, you are ultimately responsible for the content generated by the AI and published through your connected accounts. While Sparkyn automates the process, you must ensure all content complies with the community guidelines of Meta, TikTok, and YouTube.
            </p>
          </section>

          <section className="space-y-6 group p-8 rounded-3xl border transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors group-hover:bg-opacity-20" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: primaryColor }}>
                <Zap className="w-5 h-5" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>3. Service Performance</h2>
            </div>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#9ca3af' }}>
              Sparkyn uses third-party AI models. We do not guarantee specific engagement metrics, viral success, or absolute accuracy of AI-generated content. Automation is subject to the technical availability of social media platform APIs.
            </p>
          </section>

          <section className="space-y-6 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors group-hover:bg-opacity-20" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: successColor }}>
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>4. Usage & Spam</h2>
            </div>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#9ca3af' }}>
              Spamming, harassment, or the automation of illegal content is strictly prohibited. Sparkyn reserves the right to terminate accounts that use the "Creator Engine" to violate the integrity of social media platforms or harass other users.
            </p>
          </section>
        </div>
      </main>

      {/* Footer link */}
      <footer className="py-12 border-t" style={{ borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
        <div className="container text-center space-y-4">
          <Link href="/privacy" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: primaryColor, textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>© 2026 Sparkyn Automation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
