"use client"

import { useEffect, useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { createInvoiceAction } from '@/app/(app)/invoices/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/db/invoices'
import type { Client } from '@/types/database'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button id="create-invoice-submit" type="submit" disabled={pending} className="gap-2">
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Creating…' : 'Create Invoice'}
    </Button>
  )
}

export default function NewInvoicePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [state, formAction] = useActionState(createInvoiceAction, {})

  useEffect(() => {
    const supabase = createClient()
    supabase.from('clients').select('*').order('name').then(({ data }) => setClients(data || []))
  }, [])

  const addItem = () => setItems(prev => [...prev, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }])
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))

  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/invoices">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Create a new invoice for a client</p>
        </div>
      </div>

      <form action={formAction}>
        {/* Hidden serialized items */}
        <input type="hidden" name="items" value={JSON.stringify(items.map(({ description, quantity, unit_price }) => ({ description, quantity, unit_price })))} />
        <input type="hidden" name="client_id" value={clientId} />
        <input type="hidden" name="issue_date" value={issueDate} />
        <input type="hidden" name="due_date" value={dueDate} />
        <input type="hidden" name="notes" value={notes} />

        <div className="space-y-5">
          {state?.error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {state.error}
            </div>
          )}

          {/* Client + Dates */}
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Client */}
              <div className="space-y-1.5">
                <Label>Client <span className="text-destructive">*</span></Label>
                {clients.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg border border-border/50 bg-muted/30">
                    <Users className="w-4 h-4" />
                    <span>No clients yet. </span>
                    <Link href="/clients" className="text-primary hover:underline">Add a client first →</Link>
                  </div>
                ) : (
                  <Select value={clientId} onValueChange={(val) => setClientId(val || '')}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select a client…" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input id="issue_date" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} max={today} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due_date">Due Date <span className="text-destructive">*</span></Label>
                  <Input id="due_date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={issueDate} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_100px_80px_32px] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                <span>Description</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_80px_32px] gap-2 items-start">
                  <Input
                    placeholder={`Item ${idx + 1} description`}
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    required
                    aria-label="Description"
                  />
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="1"
                    value={item.quantity || ''}
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="text-right"
                    aria-label="Quantity"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unit_price || ''}
                    onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="text-right"
                    aria-label="Unit price"
                  />
                  <div className="hidden sm:flex items-center justify-end h-8 text-sm font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-muted-foreground hover:text-destructive self-start mt-0.5"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(subtotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-1.5">
              <Label htmlFor="notes_field">Notes (optional)</Label>
              <Textarea
                id="notes_field"
                placeholder="Payment terms, bank details, thank you message…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link href="/invoices">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <SubmitBtn />
          </div>
        </div>
      </form>
    </div>
  )
}
