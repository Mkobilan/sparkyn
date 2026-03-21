import Link from 'next/link'
import { Sparkles, ArrowRight, Zap, Globe, ShieldCheck, BarChart3, Clock, Layers, ChevronRight, Check } from 'lucide-react'
import { PRICING_TIERS } from '@/lib/pricing'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient relative grain overflow-hidden">
      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid hsla(0,0%,100%,0.06)', background: 'hsla(0,0%,4%,0.75)' }}>
        <nav className="container flex items-center justify-between" style={{ padding: '1rem 1.5rem' }}>
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <img src="/sparkyn_logo.jpg" alt="Sparkyn Logo" style={{ height: 32, width: 'auto', borderRadius: '4px' }} />
            <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.04em', fontFamily: "'Space Grotesk', sans-serif", color: 'white' }}>Sparkyn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>Log in</Link>
            <Link href="/signup" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.3rem' }}>
              Get Started Free <ArrowRight style={{ width: 15, height: 15, marginLeft: 4 }} />
            </Link>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <main className="container" style={{ paddingTop: '6rem', paddingBottom: '5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, hsla(36,95%,55%,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="badge" style={{ background: 'hsla(36,95%,55%,0.1)', border: '1px solid hsla(36,95%,55%,0.2)', color: 'hsl(36,95%,65%)' }}>
              <Zap style={{ width: 12, height: 12 }} /> Powered by Google Gemini AI
            </div>
            <div className="badge animate-pulse" style={{ background: 'hsla(145,65%,42%,0.1)', border: '1px solid hsla(145,65%,50%,0.2)', color: 'hsl(145,65%,60%)' }}>
              Sparkyn Beta
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
            Your Content.{' '}
            <span className="glow-text">Automated.</span>
            <br />Every Single Day.
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'hsl(0,0%,55%)', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            AI-generated posts, captions, and reels — published across all your socials on autopilot. Set it up once, grow forever.
          </p>

          <div className="flex items-center justify-center gap-4" style={{ flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary glow-amber" style={{ height: 52, padding: '0 2rem', fontSize: '1rem', borderRadius: '0.75rem' }}>
              Start Automating Now <ArrowRight style={{ width: 18, height: 18, marginLeft: 6 }} />
            </Link>
            <Link href="#features" className="btn btn-outline" style={{ height: 52, padding: '0 2rem', fontSize: '1rem', borderRadius: '0.75rem' }}>
              See How It Works
            </Link>
          </div>

          {/* Platform pills */}
          <div className="flex items-center justify-center gap-3" style={{ marginTop: '2.5rem', flexWrap: 'wrap' }}>
            {['Facebook', 'Instagram', 'TikTok', 'YouTube Shorts'].map((p) => (
              <span key={p} style={{ padding: '0.35rem 0.85rem', borderRadius: 999, border: '1px solid hsl(0,0%,14%)', background: 'hsl(0,0%,7%)', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(0,0%,55%)' }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features" className="grid grid-cols-3 gap-6" style={{ marginTop: '7rem', textAlign: 'left' }}>
          {[
            {
              icon: <Zap style={{ width: 22, height: 22, color: 'hsl(36,95%,55%)' }} />,
              iconBg: 'hsla(36,95%,55%,0.1)',
              title: 'AI Content Brain',
              desc: 'Google Gemini generates captions, hooks, and CTAs tailored to your niche — no templates, no generic trash.',
            },
            {
              icon: <Globe style={{ width: 22, height: 22, color: 'hsl(145,65%,50%)' }} />,
              iconBg: 'hsla(145,65%,42%,0.1)',
              title: 'Post Everywhere',
              desc: 'One click. Four platforms. Facebook, Instagram, TikTok, and YouTube Shorts — published simultaneously.',
            },
            {
              icon: <ShieldCheck style={{ width: 22, height: 22, color: 'hsl(36,95%,70%)' }} />,
              iconBg: 'hsla(36,95%,55%,0.1)',
              title: 'True Autopilot',
              desc: 'Set your schedule in onboarding. Sparkyn handles the rest — every day, while you sleep.',
            },
          ].map((f, i) => (
            <div key={i} className="card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: f.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'hsl(0,0%,55%)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={{ marginTop: '8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
              Pricing <span className="glow-text">Tiers</span>
            </h2>
            <p style={{ color: 'hsl(0,0%,50%)', maxWidth: 600, margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Choose the plan that fits your growth. <br />
              <span style={{ color: 'hsl(36,95%,55%)', fontWeight: 700 }}>Sparkyn is currently in beta!</span> More features are coming soon.
            </p>
            <div className="badge" style={{ background: 'hsla(36,95%,55%,0.1)', border: '1px solid hsla(36,95%,55%,0.3)', color: 'hsl(36,95%,65%)', marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              Introductory prices. Lock them in while you can!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_TIERS.map((tier) => (
              <div 
                key={tier.id} 
                className={`card ${tier.highlight ? 'glow-amber' : ''}`}
                style={{ 
                  padding: '3rem 2rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  position: 'relative',
                  border: tier.highlight ? '2px solid hsla(36,95%,55%,0.4)' : '1px solid hsl(0,0%,14%)',
                  background: tier.highlight ? 'hsla(36,95%,55%,0.03)' : 'hsl(0,0%,5%)'
                }}
              >
                {tier.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'hsl(36,95%,55%)', color: 'black', padding: '2px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{tier.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: 900 }}>{tier.price}</span>
                    <span style={{ color: 'hsl(0,0%,40%)', fontSize: '0.9rem' }}>/{tier.interval}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(0,0%,50%)', marginTop: '1rem', lineHeight: 1.6 }}>{tier.description}</p>
                </div>
                
                <div style={{ flex: 1, marginBottom: '2.5rem' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tier.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'hsl(0,0%,65%)' }}>
                        <Check style={{ width: 16, height: 16, color: 'hsl(36,95%,55%)', flexShrink: 0 }} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href={`/signup?tier=${tier.id}`} 
                  className={`btn ${tier.highlight ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '100%', height: 52, borderRadius: '0.75rem', fontWeight: 700 }}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ marginTop: '6rem', padding: '3.5rem 2rem', borderRadius: 'var(--radius)', border: '1px solid hsla(36,95%,55%,0.15)', background: 'linear-gradient(135deg, hsla(36,95%,55%,0.06), hsla(145,65%,42%,0.04))', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Ready to stop wasting time on socials?
          </h2>
          <p style={{ color: 'hsl(0,0%,50%)', marginBottom: '2rem', maxWidth: 500, margin: '0 auto 2rem' }}>
            Join hundreds of businesses who let AI do the heavy lifting.
          </p>
          <Link href="/signup" className="btn btn-primary glow-amber" style={{ height: 52, padding: '0 2rem', fontSize: '1rem' }}>
            Get Started Free <ChevronRight style={{ width: 18, height: 18, marginLeft: 4 }} />
          </Link>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid hsl(0,0%,10%)', padding: '2.5rem 0', marginTop: '2rem' }}>
        <div className="container flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex items-center gap-3">
            <img src="/sparkyn_logo.jpg" alt="Sparkyn" style={{ height: 24, borderRadius: '2px' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'white' }}>Sparkyn</span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(0,0%,40%)' }}>© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" style={{ fontSize: '0.8rem', color: 'hsl(0,0%,45%)', textDecoration: 'none', transition: 'color 0.2s' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ fontSize: '0.8rem', color: 'hsl(0,0%,45%)', textDecoration: 'none', transition: 'color 0.2s' }}>Terms of Service</Link>
            <Link href="/login" style={{ fontSize: '0.8rem', color: 'hsl(0,0%,45%)', textDecoration: 'none', transition: 'color 0.2s' }}>Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
