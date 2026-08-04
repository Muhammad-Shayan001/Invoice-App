"use client"

import { useEffect, useActionState, useState, useCallback } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useFormStatus } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { getClients } from '@/lib/db/clients'
import {
  createClientAction,
  updateClientAction,
  archiveClientAction,
  unarchiveClientAction,
  deleteClientAction
} from '@/app/(app)/clients/actions'
import { exportToCSV } from '@/lib/utils/csv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus, Search, Pencil, Trash2, Users, Mail, Phone, Loader2, AlertCircle,
  Download, Archive, ArchiveRestore, AlertTriangle,
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

type DeleteMode = 'archive' | 'hard-delete'

export default function ClientsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editClient, setEditClient] = useState<ClientWithStats | null>(null)
  const [removeClient, setRemoveClient] = useState<ClientWithStats | null>(null)
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('archive')
  const [actioning, setActioning] = useState(false)
  const queryClient = useQueryClient()
  const { data: clients, isLoading, isError, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const supabase = createClient()
      return getClients(supabase)
    }
  })


  const activeClients = (clients || []).filter(c => !c.archived)
  const archivedClients = (clients || []).filter(c => c.archived)
  const displayClients = (showArchived ? archivedClients : activeClients).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  const handleExportCSV = () => {
    exportToCSV('clients_export', displayClients, [
      { key: 'name', label: 'Client Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'invoice_count', label: 'Total Invoices', transform: (v) => String(v || 0) },
      { key: 'total_billed', label: 'Total Billed ($)', transform: (v) => String(v || 0) },
    ])
    toast.success(`Exported ${displayClients.length} client(s) to CSV!`)
  }

  const handleRemoveConfirm = async () => {
    if (!removeClient) return
    setActioning(true)

    let result: { error?: string; success?: boolean }
    if (deleteMode === 'archive') {
      result = await archiveClientAction(removeClient.id)
    } else {
      result = await deleteClientAction(removeClient.id)
    }

    setActioning(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(deleteMode === 'archive'
        ? `${removeClient.name} archived. Their invoices and time entries are preserved.`
        : `${removeClient.name} permanently deleted.`
      )
      setRemoveClient(null)
    }
  }

  const handleUnarchive = async (client: ClientWithStats) => {
    const result = await unarchiveClientAction(client.id)
    if (result?.error) toast.error(result.error)
    else { toast.success(`${client.name} restored to active clients.`); }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeClients.length} active{archivedClients.length > 0 ? ` · ${archivedClients.length} archived` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={`gap-1.5 ${showArchived ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground'}`}
          >
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? 'View Active' : 'View Archived'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5" disabled={displayClients.length === 0}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          {!showArchived && (
            <Button id="add-client-btn" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="client-search"
          placeholder={showArchived ? 'Search archived clients…' : 'Search by name or email…'}
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border-border/50">
        {isLoading ? (
          <CardContent className="pt-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </CardContent>
        ) : displayClients.length === 0 ? (
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {showArchived
                ? <Archive className="w-12 h-12 text-muted-foreground/30 mb-4" />
                : <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
              }
              <p className="font-medium">
                {search
                  ? 'No clients match your search'
                  : showArchived ? 'No archived clients' : 'No clients yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                {search
                  ? 'Try a different name or email'
                  : showArchived
                    ? 'Archived clients will appear here'
                    : 'Add your first client to start creating invoices'}
              </p>
              {!search && !showArchived && (
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
                  {displayClients.map(client => (
                    <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {client.name}
                          {client.archived && (
                            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30 bg-amber-400/10">
                              archived
                            </Badge>
                          )}
                        </div>
                      </td>
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
                          {client.archived ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleUnarchive(client)}
                              aria-label="Restore client"
                              title="Restore to active"
                            >
                              <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon-sm" onClick={() => setEditClient(client)} aria-label="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => { setRemoveClient(client); setDeleteMode('archive') }}
                            aria-label="Remove"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
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
              {displayClients.map(client => (
                <div key={client.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                    </div>
                    <div className="flex gap-1">
                      {client.archived ? (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleUnarchive(client)}>
                          <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditClient(client)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setRemoveClient(client); setDeleteMode('archive') }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{client.invoice_count} invoice{client.invoice_count !== 1 ? 's' : ''}</span>
                    <span>{formatCurrency(client.total_billed)} billed</span>
                    {client.archived && <Badge variant="outline" className="text-[10px] text-amber-400">archived</Badge>}
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
            onSuccess={() => { setAddOpen(false); toast.success('Client added!') }}
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
              onSuccess={() => { setEditClient(null); toast.success('Client updated!') }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Archive / Delete Dialog */}
      <Dialog open={!!removeClient} onOpenChange={open => !open && setRemoveClient(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Remove Client
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {removeClient && removeClient.invoice_count > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>{removeClient.name}</strong> has {removeClient.invoice_count} invoice{removeClient.invoice_count !== 1 ? 's' : ''} and
                  related time entries. Archiving preserves all records; permanent deletion removes everything.
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              What would you like to do with <span className="font-medium text-foreground">{removeClient?.name}</span>?
            </p>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteMode('archive')}
                className={`p-3 rounded-lg border text-xs text-left transition-all ${
                  deleteMode === 'archive'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                <Archive className="w-4 h-4 mb-1.5" />
                <div className="font-semibold">Archive</div>
                <div className="text-[10px] mt-0.5 opacity-80">Hide from lists, keep all data safe</div>
              </button>
              <button
                onClick={() => setDeleteMode('hard-delete')}
                className={`p-3 rounded-lg border text-xs text-left transition-all ${
                  deleteMode === 'hard-delete'
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                <Trash2 className="w-4 h-4 mb-1.5" />
                <div className="font-semibold">Delete Forever</div>
                <div className="text-[10px] mt-0.5 opacity-80">Remove client and all their invoices</div>
              </button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveClient(null)} disabled={actioning}>
                Cancel
              </Button>
              <Button
                variant={deleteMode === 'hard-delete' ? 'destructive' : 'default'}
                onClick={handleRemoveConfirm}
                disabled={actioning}
                className="gap-2"
              >
                {actioning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deleteMode === 'archive' ? 'Archive Client' : 'Delete Permanently'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
