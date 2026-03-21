'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { Save, User, Building, Trash2, Bell, AlertCircle, Loader2, Zap, ShieldCheck, Check, X, Info } from 'lucide-react'
import { getTierLimits, PRICING_TIERS } from '@/lib/pricing'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PricingModal from '@/components/PricingModal'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
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
          <div className="mb-10">
            <h1 className="text-5xl font-black font-heading tracking-tighter text-white mb-3">Settings</h1>
            <p className="text-muted-foreground text-lg opacity-80">Manage your business profile and creator preferences.</p>
          </div>

          <div className="card-premium p-0 rounded-[2.5rem] border-border/50 overflow-hidden animate-fade-in-up">
            <div className="p-10 border-b border-border/50 bg-white/5 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
              <h2 className="text-2xl font-black flex items-center gap-4 font-heading text-white relative z-10">
                <div className="p-3 bg-primary/20 rounded-2xl border border-primary/30">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                Business Profile
              </h2>
            </div>
          
          <form onSubmit={handleSave} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Business Name</label>
                <input 
                  className="input h-14 rounded-2xl bg-muted/20 border-border/50 px-6 font-bold focus:bg-muted/40 transition-all" 
                  value={profile.business_name} 
                  onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Industry</label>
                <select
                  className="input h-14 rounded-2xl bg-muted/20 border-border/50 px-6 font-bold focus:bg-muted/40 transition-all appearance-none cursor-pointer"
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

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company Description</label>
              <textarea 
                className="input min-h-[120px] rounded-2xl bg-muted/20 border-border/50 px-6 py-4 font-bold focus:bg-muted/40 transition-all resize-none" 
                value={profile.business_description} 
                onChange={(e) => setProfile({...profile, business_description: e.target.value})}
                placeholder="Tell Sparkyn about your business to improve AI accuracy..."
              />
            </div>

            <div className="flex justify-end p-10 bg-white/5 -mx-10 -mb-10 border-t border-border/50">
              <button disabled={loading} className="btn btn-primary gap-3 py-4 px-12 rounded-2xl shadow-[0_8px_30px_-5px_hsla(var(--primary),0.5)] h-16 text-lg font-black transition-all hover:scale-105 active:scale-95">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Subscription Section */}
        <div className="card-premium p-0 rounded-[2.5rem] border-primary/20 bg-primary/5 overflow-hidden animate-fade-in-up shadow-[0_0_50px_-10px_hsla(var(--primary),0.1)]" style={{ animationDelay: '100ms' }}>
          <div className="p-10 border-b border-border/50 bg-white/5 flex items-center justify-between relative overflow-hidden group">
             <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all opacity-50" />
            <h2 className="text-2xl font-black flex items-center gap-4 font-heading text-white relative z-10">
              <div className="p-3 bg-primary/20 rounded-2xl border border-primary/30">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              Subscription Plan
            </h2>
            <div className="px-5 py-2 bg-primary/20 border border-primary/30 rounded-full text-primary text-[11px] font-black uppercase tracking-[0.2em] relative z-10 shadow-lg">
              {profile.subscription_tier || 'Free'} Tier
            </div>
          </div>
          
          <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-[2rem] bg-muted/20 border border-border/50 space-y-3 relative group/stat overflow-hidden hover:border-primary/30 transition-all">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover/stat:bg-primary/10 transition-all" />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-60">Daily Allowance</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-white tracking-tighter">{getTierLimits(profile.subscription_tier).postsPerDay}</span>
                  <span className="text-sm text-muted-foreground pb-2 font-bold font-heading">posts / day / channel</span>
                </div>
              </div>
              
              <div className="p-8 rounded-[2rem] bg-muted/20 border border-border/50 space-y-3 relative group/stat overflow-hidden hover:border-primary/30 transition-all">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover/stat:bg-primary/10 transition-all" />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-60">Account Limit</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    {getTierLimits(profile.subscription_tier).accountsPerPlatform === 100 ? '∞' : getTierLimits(profile.subscription_tier).accountsPerPlatform}
                  </span>
                  <span className="text-sm text-muted-foreground pb-2 font-bold font-heading">accounts / platform</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-sm font-black text-white uppercase tracking-widest opacity-60 ml-1">Included Features:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(PRICING_TIERS.find(t => t.id === profile.subscription_tier) || PRICING_TIERS[0]).features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/10 p-4 rounded-xl border border-white/5">
                    <div className="p-1 rounded-full bg-primary/20">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    </div>
                    <span className="font-bold">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {profile.subscription_tier !== 'enterprise' && (
              <div className="p-10 rounded-[2rem] bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner relative overflow-hidden group/cta">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px] group-hover/cta:bg-primary/20 transition-all" />
                <div className="space-y-2 relative z-10">
                  <p className="text-xl font-black text-white">Need more capacity?</p>
                  <p className="text-sm text-muted-foreground font-medium opacity-80">Upgrade to a higher tier to unlock more daily posts and accounts on every platform.</p>
                </div>
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="btn btn-primary h-14 px-10 rounded-2xl font-black gap-3 text-lg shadow-[0_10px_30px_-5px_hsla(var(--primary),0.5)] transition-all hover:scale-105 active:scale-95 relative z-10"
                >
                  View Plans <Zap className="w-5 h-5 fill-black" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-premium p-10 rounded-[2.5rem] border-destructive/20 bg-destructive/5 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-destructive font-heading">Danger Zone</h3>
            <p className="text-muted-foreground font-medium text-lg opacity-80">Permanently delete your account and all AI generation data.</p>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-ghost text-destructive hover:bg-destructive/10 border border-destructive/20 h-14 px-10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all"
          >
            <Trash2 className="w-5 h-5 mr-3" /> Terminate Account
          </button>
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

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <PricingModal onClose={() => setShowUpgradeModal(false)} />
        )}
        </div>
    </main>
  )
}
