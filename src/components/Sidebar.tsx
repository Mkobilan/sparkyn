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
  Zap
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

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="nav-sidebar glass grain">
      {/* Branding */}
      <div className="p-7 flex items-center gap-3.5">
        <img src="/sparkyn_logo.jpg" alt="Sparkyn Logo" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid hsla(36,95%,55%,0.2)' }} />
        <div className="flex flex-col">
          <span className="text-xl font-extrabold font-heading tracking-tight" style={{ color: 'white' }}>Sparkyn</span>
          <span className="text-[10px] uppercase font-heavy tracking-[0.2em] text-primary opacity-80">Creator Engine</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto min-h-0">
        <div className="menu-label">Main Experience</div>
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
        
        <div className="menu-label">Insights</div>
        <Link href="/dashboard" className="nav-link opacity-60 pointer-events-none">
          <div className="nav-icon">
            <Zap className="w-[18px] h-[18px]" />
          </div>
          <span className="flex-1">AI Analytics</span>
          <div className="badge border-primary/20 bg-primary/10 text-primary text-[8px] scale-75">Pro</div>
        </Link>
      </nav>

      {/* Footer / User */}
      <div className="mt-auto border-t border-white/5 pt-4 pb-4 shrink-0">
        <div className="user-card mx-4 mb-4">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center border border-white/10 shrink-0">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-white">{user?.email?.split('@')[0] || 'Creator'}</p>
            <p className="text-[9px] text-muted-foreground truncate uppercase tracking-widest font-heavy">Free Tier</p>
          </div>
          <Zap className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
        </div>
        
        <div className="px-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-muted-foreground hover:text-destructive transition-all text-xs font-bold uppercase tracking-widest group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
