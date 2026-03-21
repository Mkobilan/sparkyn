'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Share2, 
  HelpCircle, 
  LogOut,
  Sparkles,
  ChevronRight,
  User,
  Zap,
  Facebook,
  Instagram,
  Music2,
  Play
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Content Queue', href: '/dashboard/queue', icon: Calendar },
  { name: 'Connect Accounts', href: '/dashboard/connect', icon: Share2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

const platforms = [
  { name: 'Facebook', href: '/dashboard/facebook', icon: Facebook },
  { name: 'Instagram', href: '/dashboard/instagram', icon: Instagram },
  { name: 'TikTok', href: '/dashboard/tiktok', icon: Music2 },
  { name: 'YouTube', href: '/dashboard/youtube', icon: Play },
]


export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="nav-sidebar glass grain flex flex-col overflow-hidden">
      {/* Branding - Fixed at top */}
      <div className="p-7 flex items-center gap-3.5 shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-md rounded-t-[1.5rem]">
        <img src="/sparkyn_logo.jpg" alt="Sparkyn Logo" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid hsla(36,95%,55%,0.2)' }} />
        <div className="flex flex-col">
          <span className="text-xl font-extrabold font-heading tracking-tight" style={{ color: 'white' }}>Sparkyn</span>
          <span className="text-[10px] uppercase font-heavy tracking-[0.2em] text-primary opacity-80">Creator Engine</span>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-4 min-h-0">
        <nav className="space-y-1">
          <div className="menu-label !pt-2">Main Experience</div>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ marginBottom: '4px' }}
              >
                <div className="nav-icon shrink-0">
                  <item.icon className="w-[18px] h-[18px]" />
                </div>
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse" />
                )}
              </Link>
            )
          })}
          
          <div className="menu-label mt-6">Social Platforms</div>
          {platforms.map((platform) => {
            const isActive = pathname === platform.href
            return (
              <Link
                key={platform.name}
                href={platform.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon shrink-0">
                  <platform.icon className="w-[18px] h-[18px]" />
                </div>
                <span className="flex-1 truncate">{platform.name}</span>
              </Link>
            )
          })}
          
          <div className="menu-label mt-6">Insights</div>
          <Link 
            href={profile?.subscription_tier === 'free' ? '/api/checkout?tier=pro' : '/dashboard'} 
            className="nav-link"
            style={{ opacity: profile?.subscription_tier === 'free' ? 0.6 : 1 }}
          >
            <div className="nav-icon">
              <Zap className="w-[18px] h-[18px]" />
            </div>
            <span className="flex-1">AI Analytics</span>
            {profile?.subscription_tier === 'free' && (
              <div className="badge border-primary/20 bg-primary/10 text-primary text-[8px] scale-75">Pro</div>
            )}
          </Link>
        </nav>
      </div>

      {/* Footer / User - Fixed at bottom */}
      <div className="mt-auto border-t border-white/5 p-4 shrink-0 bg-black/40 backdrop-blur-xl rounded-b-[1.5rem] flex flex-col gap-3">
        <div className="user-card !m-0 !bg-white/5 !border-white/10">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-white">{user?.email?.split('@')[0] || 'Creator'}</p>
            <p className="text-[9px] text-primary/70 truncate uppercase tracking-widest font-black">
              {profile?.subscription_tier || 'Free'} Tier
            </p>
          </div>
          <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-5 py-4 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/40 rounded-xl text-destructive transition-all group shadow-lg"
        >
          <div className="shrink-0 p-1 bg-destructive/10 rounded-md group-hover:scale-110 transition-transform">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-black uppercase tracking-[0.2em] text-[10px]">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
