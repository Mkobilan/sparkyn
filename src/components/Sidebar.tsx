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
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 glass min-h-screen border-r border-border flex flex-col fixed left-0 top-0 z-40 bg-card/50">
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
          <Sparkles className="text-primary w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight font-heading">Sparkyn</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Menu</p>
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all group ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' 
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`} />
                <span className="text-sm">{item.name}</span>
              </div>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg font-medium transition-all text-sm group"
        >
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
