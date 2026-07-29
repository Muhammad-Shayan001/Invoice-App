"use client"

import { use, useEffect, useActionState, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { updateInvoiceAction, markInvoiceUnpaidAction } from '@/app/invoices/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, Lock, RefreshCw } from 'lucide-react'
import { computeStatus, computeTotal, formatCurrency } from '@/lib/db/invoices'
import { useToast } from '@/components/toast'
import type { Client, InvoiceWithDetails } from '@/types/database'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button id="save-invoice-submit" type="submit" disabled={pending} className="gap-2">
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Saving…' : 'Save Changes'}
    </Button>
  )
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const toast = useToast()
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([])
  const [state, formAction] = useActionState(updateInvoiceAction.bind(null, id), {})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('invoices').select('*, clients(id, name, email, address, phone), invoice_items(id, description, quantity, unit_price)').eq('id', id).single(),
      supabase.from('clients').select('*').order('name'),
    ]).then(([{ data: inv }, { data: cls }]) => {
      if (inv) {
        const mapped: InvoiceWithDetails = {
          ...inv,
          status: computeStatus(inv.status, inv.due_date),
          total: computeTotal(inv.invoice_items || []),
        }
        setInvoice(mapped)
        setClientId(inv.client_id)
        setIssueDate(inv.issue_date)
        setDueDate(inv.due_date)
        setNotes(inv.notes || '')
        setItems((inv.invoice_items || []).map((item: { id: string; description: string; quantity: number; unit_price: number }) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })))
      }
      setClients(cls || [])
      setLoading(false)
    })
  }, [id])

  const handleReopen = () => startTransition(async () => {
    const result = await markInvoiceUnpaidAction(id)
    if (result?.error) toast.error(result.error)
    else {
      toast.success('Invoice reopened')
      const supabase = createClient()
      const { data } = await supabase.from('invoices').select('*, clients(*), invoice_items(*)').eq('id', id).single()
      if (data) setInvoice({ ...data, status: computeStatus(data.status, data.due_date), total: computeTotal(data.invoice_items || []) })
    }
  })

  const addItem = () => setItems(prev => [...prev, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }])
  const removeItem = (itemRemoveId: string) => setItems(prev => prev.filter(i => i.id !== itemRemoveId))
  const updateItem = (itemId: string, field: keyof LineItem, value: string | number) =>
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i))

  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0)

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  const isPaid = invoice?.status === 'paid'

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/invoices/${id}`}>
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Invoice</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{invoice?.invoice_number}</p>
        </div>
      </div>

      {isPaid ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-300">Invoice is Locked</p>
              <p className="text-sm text-amber-400/80 mt-1">This invoice is marked as paid and cannot be edited. Reopen it first to make changes.</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleReopen} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Reopen Invoice
          </Button>
        </div>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="items" value={JSON.stringify(items.map(({ description, quantity, unit_price }) => ({ description, quantity, unit_price })))} />
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="issue_date" value={issueDate} />
          <input type="hidden" name="due_date" value={dueDate} />
          <input type="hidden" name="notes" value={notes} />

          <div className="space-y-5">
            {state?.error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{state.error}
              </div>
            )}

            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Client <span className="text-destructive">*</span></Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select a client…" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Issue Date</Label>
                    <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Due Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="hidden sm:grid grid-cols-[1fr_80px_100px_80px_32px] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                  <span>Description</span><span>Qty</span><span>Unit Price</span><span className="text-right">Total</span><span />
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_80px_32px] gap-2 items-start">
                    <Input placeholder={`Item ${idx + 1} description`} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} required />
                    <Input type="number" min="0.01" step="0.01" value={item.quantity || ''} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="text-right" />
                    <Input type="number" min="0" step="0.01" value={item.unit_price || ''} onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} className="text-right" />
                    <div className="hidden sm:flex items-center justify-end h-8 text-sm font-medium">{formatCurrency(item.quantity * item.unit_price)}</div>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="text-muted-foreground hover:text-destructive self-start mt-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-1.5">
                <Label htmlFor="notes_edit">Notes (optional)</Label>
                <Textarea id="notes_edit" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Payment terms, bank details…" />
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Link href={`/invoices/${id}`}>
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
              <SubmitBtn />
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
