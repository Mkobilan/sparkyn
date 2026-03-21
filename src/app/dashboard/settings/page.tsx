'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { Save, User, Building, Trash2, Bell, AlertCircle, Loader2, Zap, ShieldCheck, Check, X, Info } from 'lucide-react'
import { getTierLimits, PRICING_TIERS } from '@/lib/pricing'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(data)
    }
    fetchProfile()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', profile.id)

    if (error) console.error(error)
    setLoading(false)
  }

  const [confirmDelete, setConfirmDelete] = useState('')

  const handleDeleteAccount = async () => {
    const expected = profile.business_name?.trim() || 'DELETE'
    if (confirmDelete !== expected) {
      alert(`Please type "${expected}" to confirm.`)
      return
    }

    setDeleting(true)
    try {
      const response = await fetch('/api/user/delete', { method: 'POST' })
      if (response.ok) {
        // Log out locally and redirect
        await supabase.auth.signOut()
        router.push('/')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete account'}`)
      }
    } catch (err) {
      console.error(err)
      alert('An unexpected error occurred.')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (!profile) return (
    <div className="flex min-h-screen bg-background items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <main className="main-content bg-gradient relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div className="max-w-4xl space-y-8">
          <div>
            <h1 className="text-4xl font-black font-heading tracking-tight text-white mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your business profile and creator preferences.</p>
          </div>

          <div className="glass rounded-[2rem] border border-border/50 overflow-hidden animate-fade-in-up">
            <div className="p-8 border-b border-border/50 bg-white/5">
              <h2 className="text-xl font-extrabold flex items-center gap-3 font-heading text-white">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                Business Profile
              </h2>
            </div>
          
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name</label>
                <input 
                  className="input" 
                  value={profile.business_name} 
                  onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
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
              <label className="text-sm font-medium">Description</label>
              <textarea 
                className="input min-h-[100px]" 
                value={profile.business_description} 
                onChange={(e) => setProfile({...profile, business_description: e.target.value})}
              />
            </div>

            <div className="flex justify-end p-8 bg-white/5 -mx-8 -mb-8 border-t border-border/50">
              <button disabled={loading} className="btn btn-primary gap-2 py-4 px-10 rounded-xl shadow-[0_8px_24px_-6px_hsla(var(--primary),0.5)]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="font-bold">Save Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Subscription Section */}
        <div className="glass rounded-[2rem] border border-border/50 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="p-8 border-b border-border/50 bg-white/5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold flex items-center gap-3 font-heading text-white">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              Subscription Plan
            </h2>
            <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest">
              {profile.subscription_tier || 'Free'} Tier
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Daily Allowance</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">{getTierLimits(profile.subscription_tier).postsPerDay}</span>
                  <span className="text-xs text-muted-foreground pb-1">posts / day / channel</span>
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Account Limit</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">
                    {getTierLimits(profile.subscription_tier).accountsPerPlatform === 100 ? '∞' : getTierLimits(profile.subscription_tier).accountsPerPlatform}
                  </span>
                  <span className="text-xs text-muted-foreground pb-1">accounts / platform</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-white">Included Features:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(PRICING_TIERS.find(t => t.id === profile.subscription_tier) || PRICING_TIERS[0]).features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {profile.subscription_tier !== 'enterprise' && (
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="font-bold text-white">Need more capacity?</p>
                  <p className="text-xs text-muted-foreground">Upgrade to a higher tier to unlock more daily posts and accounts.</p>
                </div>
                <Link href="/api/checkout?tier=pro" className="btn btn-primary px-8 py-3 rounded-xl font-bold gap-2 whitespace-nowrap shadow-[0_8px_20px_-6px_hsla(var(--primary),0.4)]">
                  Upgrade Plan <Zap className="w-4 h-4 fill-black" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-8 rounded-[2rem] border border-destructive/20 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-destructive font-heading mb-1">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all AI data.</p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-ghost text-destructive hover:bg-destructive/10 border border-destructive/10 text-xs font-black uppercase tracking-widest px-6"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="glass max-w-md w-full rounded-[2rem] border border-destructive/30 overflow-hidden shadow-[0_0_100px_-20px_rgba(239, 68, 68, 0.4)] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-border/50 bg-destructive/5 flex items-center justify-between">
                <h2 className="text-xl font-black text-destructive font-heading flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" /> Terminate Account
                </h2>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase text-[10px] tracking-widest mb-1">Irreversible Action</p>
                    <p className="font-medium opacity-90 leading-relaxed">
                      Deactivating your Sparkyn account will immediately cancel your active subscription and permanently delete all your AI training data, profiles, and history. 
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                   <p className="text-xs font-bold text-white uppercase tracking-widest opacity-60">
                     Type <span className="text-destructive">"{profile.business_name?.trim() || 'DELETE'}"</span> to confirm:
                   </p>
                   <input 
                     className="input border-destructive/20 focus:border-destructive" 
                     value={confirmDelete}
                     onChange={(e) => setConfirmDelete(e.target.value)}
                     placeholder={profile.business_name?.trim() || 'DELETE'}
                     autoFocus
                   />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="btn btn-outline py-4 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="btn bg-destructive text-white hover:bg-destructive/90 py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-[0_8px_24px_-6px_rgba(239, 68, 68, 0.5)]"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Trash2 className="w-4 h-4 text-white" />}
                    Delete 
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </main>
  )
}
