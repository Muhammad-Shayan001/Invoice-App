"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { deleteInvoiceAction } from '@/app/invoices/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Eye, Pencil, Trash2, FileText, Loader2, Filter } from 'lucide-react'
import { computeStatus, computeTotal, formatCurrency, formatDate } from '@/lib/db/invoices'
import { useToast } from '@/components/toast'
import type { InvoiceWithDetails, Client } from '@/types/database'

function StatusBadge({ status }: { status: 'paid' | 'unpaid' | 'overdue' }) {
  const cls = { paid: 'status-paid', unpaid: 'status-unpaid', overdue: 'status-overdue' }[status]
  return <span className={`${cls} px-2 py-0.5 rounded-md text-xs font-medium capitalize`}>{status}</span>
}

export default function InvoicesPage() {
  const toast = useToast()
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [deleteInv, setDeleteInv] = useState<InvoiceWithDetails | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: invData }, { data: clientData }] = await Promise.all([
      supabase.from('invoices').select('*, clients(id, name, email, address, phone), invoice_items(id, description, quantity, unit_price)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
    ])
    setInvoices((invData || []).map(inv => ({
      ...inv,
      status: computeStatus(inv.status, inv.due_date),
      total: computeTotal(inv.invoice_items || []),
    })))
    setClients(clientData || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    if (clientFilter !== 'all' && inv.client_id !== clientFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return inv.invoice_number.toLowerCase().includes(q) || inv.clients?.name.toLowerCase().includes(q)
    }
    return true
  })

  const handleDelete = async () => {
    if (!deleteInv) return
    setDeleting(true)
    const result = await deleteInvoiceAction(deleteInv.id)
    setDeleting(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Invoice deleted')
      setDeleteInv(null)
      load()
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/invoices/new">
          <Button id="new-invoice-btn" size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoice # or client…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8">
              <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        {loading ? (
          <CardContent className="pt-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium">{search || statusFilter !== 'all' || clientFilter !== 'all' ? 'No matching invoices' : 'No invoices yet'}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                {search || statusFilter !== 'all' || clientFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first invoice to get started'}
              </p>
              {!search && statusFilter === 'all' && clientFilter === 'all' && (
                <Link href="/invoices/new">
                  <Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" />New Invoice</Button>
                </Link>
              )}
            </div>
          </CardContent>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {['Invoice #', 'Client', 'Issued', 'Due', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className={`px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${h === 'Amount' || h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map(inv => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-medium">{inv.clients?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.issue_date)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="ghost" size="icon-sm" aria-label="View"><Eye className="w-3.5 h-3.5" /></Button>
                          </Link>
                          <Link href={`/invoices/${inv.id}/edit`}>
                            <Button variant="ghost" size="icon-sm" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteInv(inv)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-border/30">
              {filtered.map(inv => (
                <div key={inv.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{inv.clients?.name}</p>
                      <p className="text-xs font-mono text-primary">{inv.invoice_number}</p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Due {formatDate(inv.due_date)}</div>
                    <div className="font-semibold">{formatCurrency(inv.total)}</div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/invoices/${inv.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5"><Eye className="w-3.5 h-3.5" />View</Button>
                    </Link>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteInv(inv)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteInv} onOpenChange={open => !open && setDeleteInv(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently delete <span className="font-medium text-foreground">{deleteInv?.invoice_number}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteInv(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
