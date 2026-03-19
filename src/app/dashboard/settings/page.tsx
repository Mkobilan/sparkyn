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
      <main className="flex-1 ml-64 p-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your business profile and preferences.</p>
        </div>

        <div className="glass card p-0 overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" /> Business Profile
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

            <div className="flex justify-end p-6 bg-muted/30 -mx-6 -mb-6 border-t border-border">
              <button disabled={loading} className="btn btn-primary gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        <div className="glass card border-destructive/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
            </div>
            <button className="btn btn-secondary text-destructive hover:bg-destructive/10 border-destructive/20">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
