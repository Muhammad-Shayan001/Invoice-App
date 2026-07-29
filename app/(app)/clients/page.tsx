"use client"

import { useEffect, useActionState, useState, useCallback } from 'react'
import { useFormStatus } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import {
  createClientAction,
  updateClientAction,
  deleteClientAction,
} from '@/app/(app)/clients/actions'
import { exportToCSV } from '@/lib/utils/csv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus, Search, Pencil, Trash2, Users, Mail, Phone, Loader2, AlertCircle, Download,
} from 'lucide-react'
import { formatCurrency } from '@/lib/db/invoices'
import { useToast } from '@/components/toast'
import type { ClientWithStats } from '@/types/database'

function SubmitBtn({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button id="client-submit" type="submit" disabled={pending} className="gap-2">
      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {pending ? pendingLabel : label}
    </Button>
  )
}

function ClientForm({
  action,
  initialData,
  onSuccess,
  error,
}: {
  action: (p: { error?: string; success?: boolean }, fd: FormData) => Promise<{ error?: string; success?: boolean }>
  initialData?: ClientWithStats | null
  onSuccess: () => void
  error?: string
}) {
  const [state, formAction] = useActionState(action, {})

  useEffect(() => {
    if (state?.success) onSuccess()
  }, [state?.success, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      {(state?.error || error) && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {state?.error || error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input id="name" name="name" defaultValue={initialData?.name} required placeholder="Acme Corp" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={initialData?.email ?? ''} placeholder="client@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={initialData?.phone ?? ''} placeholder="+1 (555) 000-0000" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" defaultValue={initialData?.address ?? ''} placeholder="123 Main St, City, State 12345" rows={3} />
      </div>
      <DialogFooter>
        <SubmitBtn label={initialData ? 'Save Changes' : 'Add Client'} pendingLabel="Saving…" />
      </DialogFooter>
    </form>
  )
}

export default function ClientsPage() {
  const toast = useToast()
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editClient, setEditClient] = useState<ClientWithStats | null>(null)
  const [deleteClient, setDeleteClient] = useState<ClientWithStats | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadClients = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('clients')
      .select('*, invoices(id, invoice_items(quantity, unit_price))')
      .order('name', { ascending: true })

    const mapped: ClientWithStats[] = (data || []).map((c) => {
      const invoices = c.invoices || []
      const total_billed = invoices.reduce((sum: number, inv: { invoice_items: { quantity: number; unit_price: number }[] }) => {
        return sum + (inv.invoice_items || []).reduce((s: number, item: { quantity: number; unit_price: number }) => s + item.quantity * item.unit_price, 0)
      }, 0)
      return { ...c, invoice_count: invoices.length, total_billed, invoices: undefined }
    })
    setClients(mapped)
    setLoading(false)
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  const handleExportCSV = () => {
    exportToCSV('clients_export', filtered, [
      { key: 'name', label: 'Client Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'invoice_count', label: 'Total Invoices', transform: (v) => String(v || 0) },
      { key: 'total_billed', label: 'Total Billed ($)', transform: (v) => String(v || 0) },
    ])
    toast.success(`Exported ${filtered.length} client(s) to CSV!`)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteClient) return
    setDeleting(true)
    const result = await deleteClientAction(deleteClient.id)
    setDeleting(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`${deleteClient.name} deleted`)
      setDeleteClient(null)
      loadClients()
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5" disabled={filtered.length === 0}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button id="add-client-btn" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="client-search"
          placeholder="Search by name or email…"
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
              <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium">
                {search ? 'No clients match your search' : 'No clients yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                {search ? 'Try a different name or email' : 'Add your first client to start creating invoices'}
              </p>
              {!search && (
                <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Client
                </Button>
              )}
            </div>
          </CardContent>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoices</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Billed</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map(client => (
                    <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{client.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="space-y-0.5">
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="w-3 h-3" />{client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="w-3 h-3" />{client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{client.invoice_count}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(client.total_billed)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditClient(client)} aria-label="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteClient(client)} aria-label="Delete" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-border/30">
              {filtered.map(client => (
                <div key={client.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditClient(client)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteClient(client)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{client.invoice_count} invoice{client.invoice_count !== 1 ? 's' : ''}</span>
                    <span>{formatCurrency(client.total_billed)} billed</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            action={createClientAction}
            onSuccess={() => { setAddOpen(false); loadClients(); toast.success('Client added!') }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editClient} onOpenChange={open => !open && setEditClient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editClient && (
            <ClientForm
              action={updateClientAction.bind(null, editClient.id)}
              initialData={editClient}
              onSuccess={() => { setEditClient(null); loadClients(); toast.success('Client updated!') }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteClient} onOpenChange={open => !open && setDeleteClient(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will permanently delete <span className="font-medium text-foreground">{deleteClient?.name}</span> and ALL their associated invoices. This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteClient(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting} className="gap-2">
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Client
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
