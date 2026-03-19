'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
      <div className="min-h-screen grid items-center justify-center bg-gradient p-4">
        <div className="glass card w-full max-w-md text-center space-y-6">
          <div className="p-3 bg-primary/20 rounded-2xl mx-auto w-fit">
            <Mail className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground">We&apos;ve sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your account.</p>
          <button onClick={() => setSuccess(false)} className="btn btn-secondary w-full">Back to signup</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid items-center justify-center bg-gradient p-4">
      <div className="glass card w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <Sparkles className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground text-center">Start your journey to automated social growth.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="John Doe"
                className="input px-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="name@company.com"
                className="input px-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                placeholder="••••••••"
                className="input px-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="text-destructive text-sm px-1">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary w-full gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get Started <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
