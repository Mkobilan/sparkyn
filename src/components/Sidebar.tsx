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
  Sparkles
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
    <div className="w-64 glass min-h-screen border-r border-border flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-xl">
          <Sparkles className="text-primary w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight">Sparkyn</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg font-medium transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
