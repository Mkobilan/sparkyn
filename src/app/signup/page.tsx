'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Mail, Lock, ArrowRight, Loader2, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }} className="bg-gradient">
        <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsla(145,65%,42%,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 style={{ width: 32, height: 32, color: 'hsl(145,65%,42%)' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Check your email</h2>
          <p style={{ color: 'hsl(0,0%,55%)', lineHeight: 1.7, marginBottom: '2rem' }}>
            We&apos;ve sent a confirmation link to <strong style={{ color: 'hsl(36,95%,55%)' }}>{email}</strong>. Click the link to verify your account and get started.
          </p>
          <button onClick={() => setSuccess(false)} className="btn btn-secondary" style={{ width: '100%' }}>Back to signup</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }} className="bg-gradient">
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '0.75rem', background: 'hsla(36,95%,55%,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Sparkles style={{ width: 24, height: 24, color: 'hsl(36,95%,55%)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>Create Account</h1>
          <p style={{ color: 'hsl(0,0%,50%)', fontSize: '0.9rem' }}>Start your journey to automated social growth.</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, paddingLeft: 2 }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: 12, top: 12, width: 18, height: 18, color: 'hsl(0,0%,40%)' }} />
              <input
                type="text"
                placeholder="John Doe"
                className="input"
                style={{ paddingLeft: 40 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

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

          {/* Confirm Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, paddingLeft: 2 }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 12, top: 12, width: 18, height: 18, color: 'hsl(0,0%,40%)' }} />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="input"
                style={{ paddingLeft: 40, paddingRight: 44 }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'hsl(0,0%,45%)' }}
              >
                {showConfirm ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </div>

          {error && <p style={{ color: 'hsl(0,65%,50%)', fontSize: '0.8rem', paddingLeft: 2 }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: 46, marginTop: '0.5rem', gap: '0.4rem' }}>
            {loading ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : <>Get Started <ArrowRight style={{ width: 18, height: 18 }} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'hsl(0,0%,50%)', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'hsl(36,95%,55%)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
