"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { CommandPalette } from '@/components/CommandPalette'
import { cn } from '@/lib/utils'
import {
  Receipt,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Search,
  Command,
} from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ onNavigate, onOpenSearch }: { onNavigate?: () => void; onOpenSearch: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border/50">
        <div className="p-1.5 rounded-lg bg-primary/15">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <span className="font-bold text-lg tracking-tight">Invoicer</span>
      </div>

      {/* Quick Search Trigger */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            onOpenSearch()
            onNavigate?.()
          }}
          className="flex w-full items-center justify-between px-3 py-2 rounded-lg border border-border/50 bg-muted/40 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
          </div>
          <div className="flex items-center gap-0.5 font-mono text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-border/50">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border/50">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const pathname = usePathname()

  // Theme Sync
  useEffect(() => {
    const theme = localStorage.getItem('invoicer_theme') || 'dark'
    setIsDark(theme === 'dark')
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('invoicer_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('invoicer_theme', 'light')
    }
  }

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentPage = navLinks.find(l => l.href === pathname || (l.href !== '/dashboard' && pathname.startsWith(l.href)))?.label || 'Dashboard'

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Command Palette Modal */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border/50 bg-sidebar shrink-0">
        <SidebarContent onOpenSearch={() => setCmdOpen(true)} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="flex items-center justify-between h-14 px-4 sm:px-6 border-b border-border/50 bg-background shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-60">
                  <SidebarContent onNavigate={() => setMobileOpen(false)} onOpenSearch={() => setCmdOpen(true)} />
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary md:hidden" />
              <span className="font-semibold text-sm">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Search Button Header */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCmdOpen(true)}
              className="gap-2 text-xs text-muted-foreground hover:text-foreground hidden sm:flex"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </Button>

            {/* Dark / Light Mode Toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
