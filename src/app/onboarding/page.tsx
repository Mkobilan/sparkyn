'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Share2, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Facebook,
  Instagram,
  Youtube,
  Music2, // For TikTok
  Globe,
  Target,
  MessageSquare
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    business_name: '',
    industry: 'SaaS/Tech',
    niche_description: '',
    business_description: '',
    website_url: '',
    primary_goal: 'Drive traffic to website',
    posts_per_day: 1,
    posting_times: ['09:00'],
    platforms: [] as string[],
    content_tone: 'Casual & Friendly'
  })

  const router = useRouter()
  const supabase = createClient()

  // Steps handling
  const nextStep = () => setStep((s) => (s + 1) as Step)
  const prevStep = () => setStep((s) => (s - 1) as Step)

  const handleComplete = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profile,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error(error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Tracker */}
        <div className="flex justify-between items-center mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === s ? 'bg-primary text-primary-foreground' : 
                step > s ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span className={`text-sm font-medium ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Profile' : s === 2 ? 'Connect' : 'Schedule'}
              </span>
              {s < 3 && <div className="w-12 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        <div className="glass card space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="text-primary" /> Tell us about your business
                </h2>
                <p className="text-muted-foreground">This helps AI generate relevant content for your niche.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1">Business Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Sparkyn AI"
                    value={profile.business_name}
                    onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1">Industry</label>
                  <select
                    className="input"
                    value={profile.industry}
                    onChange={(e) => setProfile({...profile, industry: e.target.value})}
                  >
                    <option>E-commerce</option>
                    <option>SaaS/Tech</option>
                    <option>Coaching</option>
                    <option>Fitness</option>
                    <option>Food & Beverage</option>
                    <option>Real Estate</option>
                    <option>Beauty & Wellness</option>
                    <option>Creative Agency</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Business Description</label>
                <textarea
                  className="input min-h-[100px] py-3"
                  placeholder="Tell us about what you do, who you help, and your unique value proposition..."
                  value={profile.business_description}
                  onChange={(e) => setProfile({...profile, business_description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center gap-1">
                    <Globe className="w-4 h-4" /> Website URL (optional)
                  </label>
                  <input
                    className="input"
                    placeholder="https://example.com"
                    value={profile.website_url}
                    onChange={(e) => setProfile({...profile, website_url: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center gap-1">
                    <Target className="w-4 h-4" /> Primary Goal
                  </label>
                  <select
                    className="input"
                    value={profile.primary_goal}
                    onChange={(e) => setProfile({...profile, primary_goal: e.target.value})}
                  >
                    <option>Drive traffic to website</option>
                    <option>Build brand awareness</option>
                    <option>Generate leads</option>
                    <option>Grow followers</option>
                    <option>Sell products</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Share2 className="text-primary" /> Connect Social Accounts
                </h2>
                <p className="text-muted-foreground">Select the platforms you want to automate.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
                  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
                  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#000000' },
                  { id: 'youtube', name: 'YouTube Shorts', icon: Youtube, color: '#FF0000' },
                ].map((p) => (
                  <button
                    key={p.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      profile.platforms.includes(p.id) ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                    onClick={() => {
                      const newPlatforms = profile.platforms.includes(p.id)
                        ? profile.platforms.filter((id) => id !== p.id)
                        : [...profile.platforms, p.id]
                      setProfile({...profile, platforms: newPlatforms})
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background border border-border">
                        <p.icon className="w-6 h-6" style={{ color: p.color }} />
                      </div>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    {profile.platforms.includes(p.id) ? (
                      <CheckCircle2 className="text-primary w-5 h-5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                <strong>Note:</strong> You can skip this step and connect later in Settings.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="text-primary" /> Posting Schedule
                </h2>
                <p className="text-muted-foreground">How often should AI post for you?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1">Posts per day</label>
                  <div className="flex gap-4">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        className={`flex-1 py-3 px-6 rounded-lg border transition-all font-bold ${
                          profile.posts_per_day === num ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'
                        }`}
                        onClick={() => setProfile({...profile, posts_per_day: num})}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" /> Content Tone
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Professional', 'Casual & Friendly', 'Humorous', 'Inspirational', 'Educational'].map((tone) => (
                      <button
                        key={tone}
                        className={`py-2 px-4 rounded-lg border text-sm transition-all ${
                          profile.content_tone === tone ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:border-primary/30'
                        }`}
                        onClick={() => setProfile({...profile, content_tone: tone})}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-border">
            {step > 1 ? (
              <button onClick={prevStep} className="btn btn-secondary gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            
            {step < 3 ? (
              <button 
                onClick={nextStep} 
                className="btn btn-primary gap-2"
                disabled={step === 1 && !profile.business_name}
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleComplete} 
                disabled={loading}
                className="btn btn-primary gap-2 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Finalizing...' : 'Complete Setup'} <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
