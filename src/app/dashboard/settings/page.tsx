'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { Save, User, Building, Trash2, Bell, AlertCircle, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

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

  if (!profile) return (
    <div className="flex min-h-screen bg-background items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
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

        <div className="glass p-8 rounded-[2rem] border border-destructive/20 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-destructive font-heading mb-1">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all AI data.</p>
            </div>
            <button className="btn btn-ghost text-destructive hover:bg-destructive/10 border border-destructive/10 text-xs font-black uppercase tracking-widest px-6">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </button>
          </div>
          </div>
        </div>
      </main>
    </div>
  )
}
