'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams.get('tier')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && tier) {
        await supabase
          .from('profiles')
          .update({ pending_tier: tier })
          .eq('id', user.id)
      }
      
      router.refresh()
      if (tier) {
        router.push(`/api/checkout?tier=${tier}`)
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }} className="bg-gradient">
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '1rem', background: 'hsla(36,95%,55%,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid hsla(36,95%,55%,0.2)' }} className="glow-amber">
            <img src="/sparkyn_icon.jpg" alt="Sparkyn" style={{ width: 40, height: 40, borderRadius: '0.5rem' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem', fontFamily: "'Space Grotesk', sans-serif" }}>Welcome back</h1>
          <p style={{ color: 'hsl(0,0%,50%)', fontSize: '0.9rem' }}>Sign in to automate your growth.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, paddingLeft: 2 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 12, top: 12, width: 18, height: 18, color: 'hsl(0,0%,40%)' }} />
              <input
                type="email"
                placeholder="name@company.com"
                className="input"
                style={{ paddingLeft: 40 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, paddingLeft: 2 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 12, top: 12, width: 18, height: 18, color: 'hsl(0,0%,40%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="input"
                style={{ paddingLeft: 40, paddingRight: 44 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'hsl(0,0%,45%)' }}
              >
                {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </div>

          {error && <p style={{ color: 'hsl(0,65%,50%)', fontSize: '0.8rem', paddingLeft: 2 }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: 46, marginTop: '0.5rem', gap: '0.4rem' }}>
            {loading ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : <>Sign In <ArrowRight style={{ width: 18, height: 18 }} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'hsl(0,0%,50%)', marginTop: '1.5rem' }}>
          Don&apos;t have an account?{' '}
          <Link href={`/signup${tier ? `?tier=${tier}` : ''}`} style={{ color: 'hsl(36,95%,55%)', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }} className="bg-gradient">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
