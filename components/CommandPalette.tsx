"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Search, FileText, Users, Command, ArrowRight,
  LayoutDashboard, Clock, Globe, Calculator, FileCheck,
  FileSpreadsheet, Percent, AlertTriangle, Scale, QrCode,
  Settings, BarChart3, Receipt,
} from 'lucide-react'
import { formatCurrency } from '@/lib/db/invoices'

type ResultType = 'invoice' | 'client' | 'page'

interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle: string
  href: string
  icon?: React.ElementType
}

// All navigable pages in the suite — always shown as quick-nav shortcuts
const SUITE_PAGES: SearchResult[] = [
  { id: 'dashboard', type: 'page', title: 'Dashboard', subtitle: 'Unified overview', href: '/dashboard', icon: LayoutDashboard },
  { id: 'invoices', type: 'page', title: 'Invoices', subtitle: 'All invoices', href: '/invoices', icon: FileText },
  { id: 'time', type: 'page', title: 'Time Tracker', subtitle: 'Log and manage billable hours', href: '/time', icon: Clock },
  { id: 'clients', type: 'page', title: 'Clients', subtitle: 'Manage your client list', href: '/clients', icon: Users },
  { id: 'reports', type: 'page', title: 'Reports', subtitle: 'Revenue, time and expense analytics', href: '/reports', icon: BarChart3 },
  { id: 'currency', type: 'page', title: 'Currency Converter', subtitle: 'Convert between currencies', href: '/tools/currency', icon: Globe },
  { id: 'rate-calc', type: 'page', title: 'Hourly Rate Calculator', subtitle: 'Find your ideal hourly rate', href: '/tools/rate-calculator', icon: Calculator },
  { id: 'proposals', type: 'page', title: 'Proposal Generator', subtitle: 'Create client proposals', href: '/tools/proposals', icon: FileCheck },
  { id: 'contracts', type: 'page', title: 'Contract Generator', subtitle: 'Generate contracts', href: '/tools/contracts', icon: FileSpreadsheet },
  { id: 'expenses', type: 'page', title: 'Expense Tracker', subtitle: 'Log and categorize expenses', href: '/tools/expenses', icon: Receipt },
  { id: 'tax', type: 'page', title: 'Tax Estimator', subtitle: 'Estimate taxes and set-asides', href: '/tools/tax', icon: Percent },
  { id: 'late-fee', type: 'page', title: 'Late Fee Calculator', subtitle: 'Calculate late payment charges', href: '/tools/late-fee', icon: AlertTriangle },
  { id: 'rate-compare', type: 'page', title: 'Rate Comparison', subtitle: 'Compare freelance rates', href: '/tools/rate-compare', icon: Scale },
  { id: 'qr', type: 'page', title: 'QR Payment Code', subtitle: 'Generate payment QR codes', href: '/tools/qr', icon: QrCode },
  { id: 'settings', type: 'page', title: 'Settings', subtitle: 'Account preferences and defaults', href: '/settings', icon: Settings },
]

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const fetchResults = useCallback(async (q: string) => {
    const lower = q.trim().toLowerCase()

    if (!lower) {
      // Default state: show all suite pages for quick navigation
      setResults(SUITE_PAGES)
      setSelectedIndex(0)
      return
    }

    const supabase = createClient()

    // Filter pages locally (instant)
    const matchedPages: SearchResult[] = SUITE_PAGES.filter(p =>
      p.title.toLowerCase().includes(lower) ||
      p.subtitle.toLowerCase().includes(lower)
    )

    // Fetch invoices and clients from database
    const [{ data: invoices }, { data: clients }] = await Promise.all([
      supabase.from('invoices').select('id, invoice_number, clients(name), invoice_items(quantity, unit_price)').limit(8),
      supabase.from('clients').select('id, name, email').limit(8),
    ])

    const matchedInvoices: SearchResult[] = (invoices || [])
      .filter((inv: any) =>
        inv.invoice_number.toLowerCase().includes(lower) ||
        inv.clients?.name?.toLowerCase().includes(lower)
      )
      .map((inv: any) => {
        const total = (inv.invoice_items || []).reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0)
        return {
          id: inv.id,
          type: 'invoice' as ResultType,
          title: inv.invoice_number,
          subtitle: `${inv.clients?.name || 'Client'} • ${formatCurrency(total)}`,
          href: `/invoices/${inv.id}`,
          icon: FileText,
        }
      })

    const matchedClients: SearchResult[] = (clients || [])
      .filter((c: any) =>
        c.name.toLowerCase().includes(lower) ||
        (c.email && c.email.toLowerCase().includes(lower))
      )
      .map((c: any) => ({
        id: c.id,
        type: 'client' as ResultType,
        title: c.name,
        subtitle: c.email || 'No email',
        href: `/clients`,
        icon: Users,
      }))

    setResults([...matchedInvoices, ...matchedClients, ...matchedPages])
    setSelectedIndex(0)
  }, [])

  useEffect(() => {
    fetchResults(query)
  }, [query, fetchResults])

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      fetchResults('')
    }
  }, [open, fetchResults])

  const handleSelect = (href: string) => {
    onOpenChange(false)
    setQuery('')
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex].href)
    }
  }

  // Group results by type
  const groups: { label: string; items: SearchResult[] }[] = []
  const invoiceResults = results.filter(r => r.type === 'invoice')
  const clientResults = results.filter(r => r.type === 'client')
  const pageResults = results.filter(r => r.type === 'page')
  if (invoiceResults.length > 0) groups.push({ label: 'Invoices', items: invoiceResults })
  if (clientResults.length > 0) groups.push({ label: 'Clients', items: clientResults })
  if (pageResults.length > 0) groups.push({ label: query.trim() ? 'Pages & Tools' : 'Quick Navigation', items: pageResults })

  let globalIndex = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-border/60 shadow-2xl bg-card" showCloseButton={false}>
        <div className="flex items-center px-4 border-b border-border/50">
          <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
          <Input
            placeholder="Search invoices, clients, or tools (⌘K)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm bg-transparent"
            autoFocus
          />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded font-mono shrink-0">
            <Command className="w-3 h-3" /> K
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching results found.
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.label}>
                  <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map(res => {
                      const Icon = res.icon || (res.type === 'invoice' ? FileText : Users)
                      const isSelected = globalIndex++ === selectedIndex

                      return (
                        <button
                          key={`${res.type}-${res.id}`}
                          onClick={() => handleSelect(res.href)}
                          onMouseEnter={() => setSelectedIndex(groups.flatMap(g => g.items).indexOf(res))}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-colors ${
                            isSelected ? 'bg-primary/15 text-primary' : 'hover:bg-muted/40 text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{res.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{res.subtitle}</p>
                            </div>
                          </div>
                          <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-primary' : 'opacity-0'}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border/40 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1 rounded">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1 rounded">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1 rounded">Esc</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
