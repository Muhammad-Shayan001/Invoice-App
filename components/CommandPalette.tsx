"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, FileText, Users, Command, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/db/invoices'

interface SearchResult {
  id: string
  type: 'invoice' | 'client'
  title: string
  subtitle: string
  href: string
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }

    const supabase = createClient()
    const lower = q.toLowerCase()

    const [{ data: invoices }, { data: clients }] = await Promise.all([
      supabase.from('invoices').select('id, invoice_number, clients(name), invoice_items(quantity, unit_price)').limit(5),
      supabase.from('clients').select('id, name, email').limit(5),
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
          type: 'invoice',
          title: inv.invoice_number,
          subtitle: `${inv.clients?.name || 'Client'} • ${formatCurrency(total)}`,
          href: `/invoices/${inv.id}`,
        }
      })

    const matchedClients: SearchResult[] = (clients || [])
      .filter((c: any) =>
        c.name.toLowerCase().includes(lower) ||
        (c.email && c.email.toLowerCase().includes(lower))
      )
      .map((c: any) => ({
        id: c.id,
        type: 'client',
        title: c.name,
        subtitle: c.email || 'No email',
        href: `/clients`,
      }))

    setResults([...matchedInvoices, ...matchedClients])
    setSelectedIndex(0)
  }, [])

  useEffect(() => {
    fetchResults(query)
  }, [query, fetchResults])

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-border/60 shadow-2xl bg-card">
        <div className="flex items-center px-4 border-b border-border/50">
          <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
          <Input
            placeholder="Search invoices or clients (e.g. INV-0001, John)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm bg-transparent"
            autoFocus
          />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded font-mono">
            <Command className="w-3 h-3" /> K
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Type a name or invoice number to search...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching invoices or clients found.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res, index) => {
                const Icon = res.type === 'invoice' ? FileText : Users
                const isSelected = index === selectedIndex

                return (
                  <button
                    key={`${res.type}-${res.id}`}
                    onClick={() => handleSelect(res.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
