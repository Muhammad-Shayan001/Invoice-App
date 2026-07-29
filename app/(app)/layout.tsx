"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { CommandPalette } from '@/components/CommandPalette'
import { OnboardingModal } from '@/components/OnboardingModal'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import {
  Receipt,
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Globe,
  Calculator,
  FileCheck,
  FileSpreadsheet,
  Percent,
  AlertTriangle,
  Scale,
  QrCode,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  Zap,
  Search,
  Command,
  ChevronDown,
  Wrench,
  BarChart3,
} from 'lucide-react'

const mainLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/time', label: 'Time Tracker', icon: Clock },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

const toolLinks = [
  { href: '/tools/currency', label: 'Currency Converter', icon: Globe },
  { href: '/tools/rate-calculator', label: 'Hourly Rate Calc', icon: Calculator },
  { href: '/tools/proposals', label: 'Proposal Generator', icon: FileCheck },
  { href: '/tools/contracts', label: 'Contract Generator', icon: FileSpreadsheet },
  { href: '/tools/expenses', label: 'Expense Tracker', icon: Receipt },
  { href: '/tools/tax', label: 'Tax Estimator', icon: Percent },
  { href: '/tools/late-fee', label: 'Late Fee Calc', icon: AlertTriangle },
  { href: '/tools/rate-compare', label: 'Rate Comparison', icon: Scale },
  { href: '/tools/qr', label: 'QR Payment Code', icon: QrCode },
]

function SidebarContent({ onNavigate, onOpenSearch }: { onNavigate?: () => void; onOpenSearch: () => void }) {
  const pathname = usePathname()
  const [toolsOpen, setToolsOpen] = useState(true)

  const allLinks = [...mainLinks, ...toolLinks, { href: '/settings', label: 'Settings', icon: Settings }]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/50 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/15">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight block leading-tight">Invoicer</span>
          <span className="text-[10px] text-muted-foreground font-mono">Freelancer Suite</span>
        </div>
      </div>

      {/* Quick Search Trigger */}
      <div className="px-3 pt-3 shrink-0">
        <button
          onClick={() => {
            onOpenSearch()
            onNavigate?.()
          }}
          className="flex w-full items-center justify-between px-3 py-2 rounded-lg border border-border/50 bg-muted/40 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search tools...</span>
          </div>
          <div className="flex items-center gap-0.5 font-mono text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-border/50">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Main Section */}
        <div className="space-y-0.5">
          {mainLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  active
                    ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px] font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Tools Section */}
        <div className="space-y-1 pt-2 border-t border-border/40">
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className="flex items-center justify-between w-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-primary" />
              <span>Tools & Calculators</span>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", !toolsOpen && "-rotate-90")} />
          </button>

          {toolsOpen && (
            <div className="space-y-0.5 pl-1 pt-1">
              {toolLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                      active
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="pt-2 border-t border-border/40">
          <Link
            href="/settings"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
              pathname === '/settings'
                ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px] font-semibold'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-border/50 shrink-0">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-150"
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
  const [showOnboarding, setShowOnboarding] = useState(false)
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

  // Onboarding check — runs once on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('onboarding_completed').single().then(({ data }) => {
      if (data && data.onboarding_completed === false) {
        setShowOnboarding(true)
      } else if (!data) {
        // No profile row yet — brand new user
        setShowOnboarding(true)
      }
    })
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

  const allLinks = [...mainLinks, ...toolLinks, { href: '/settings', label: 'Settings', icon: Settings }]
  const currentPage = allLinks.find(l => l.href === pathname || (l.href !== '/dashboard' && pathname.startsWith(l.href)))?.label || 'Freelancer Suite'

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Onboarding Modal — blocks UI for first-time users */}
      <OnboardingModal open={showOnboarding} onComplete={() => setShowOnboarding(false)} />

      {/* Command Palette Modal */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-sidebar shrink-0">
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
                <SheetContent side="left" className="p-0 w-64">
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
              <span>Search suite...</span>
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
              {isDark ? <Sparkles className="w-4 h-4 text-amber-400" /> : <Zap className="w-4 h-4 text-indigo-500" />}
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
