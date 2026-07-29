"use client"

import { use, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import {
  markInvoicePaidAction,
  markInvoiceUnpaidAction,
  deleteInvoiceAction,
  duplicateInvoiceAction,
} from '@/app/(app)/invoices/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  ArrowLeft, Download, Send, CheckCircle, Pencil, Trash2, Loader2,
  AlertCircle, Lock, RefreshCw, Mail, Phone, MapPin, Calendar, Hash,
  Copy, Printer, ExternalLink
} from 'lucide-react'
import { computeStatus, computeTotal, formatCurrency, formatDate } from '@/lib/db/invoices'
import { useToast } from '@/components/toast'
import type { InvoiceWithDetails } from '@/types/database'

function StatusBadge({ status }: { status: 'paid' | 'unpaid' | 'overdue' }) {
  const cls = { paid: 'status-paid', unpaid: 'status-unpaid', overdue: 'status-overdue' }[status]
  return <span className={`${cls} px-2.5 py-1 rounded-md text-xs font-medium capitalize`}>{status}</span>
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const toast = useToast()
  const router = useRouter()
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(id, name, email, address, phone), invoice_items(id, description, quantity, unit_price)')
      .eq('id', id)
      .single()

    if (!data) { setNotFound(true); setLoading(false); return }

    setInvoice({
      ...data,
      status: computeStatus(data.status, data.due_date),
      total: computeTotal(data.invoice_items || []),
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleMarkPaid = () => startTransition(async () => {
    const result = await markInvoicePaidAction(id)
    if (result?.error) toast.error(result.error)
    else { toast.success('Invoice marked as paid!'); load() }
  })

  const handleMarkUnpaid = () => startTransition(async () => {
    const result = await markInvoiceUnpaidAction(id)
    if (result?.error) toast.error(result.error)
    else { toast.success('Invoice reopened'); load() }
  })

  const handleDuplicate = () => startTransition(async () => {
    setDuplicating(true)
    const result = await duplicateInvoiceAction(id)
    setDuplicating(false)
    if (result?.error) toast.error(result.error)
    else toast.success('Invoice duplicated as new draft!')
  })

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/pay/${id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Client payment link copied to clipboard!')
  }

  const handleSend = async () => {
    if (!invoice?.clients?.email) { toast.error('Client has no email address'); return }
    setSending(true)
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' })
      const json = await res.json()
      if (json.error) toast.error(json.error)
      else toast.success(`Invoice sent directly to ${invoice.clients.email}`)
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteInvoiceAction(id)
    if (result?.error) { toast.error(result.error); setDeleting(false) }
    else { toast.success('Invoice deleted'); router.push('/invoices') }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (notFound || !invoice) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="font-medium mb-2">Invoice not found</p>
        <Link href="/invoices"><Button variant="outline" size="sm">← Back to Invoices</Button></Link>
      </div>
    )
  }

  const isPaid = invoice.status === 'paid'

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Top nav */}
      <div className="flex items-center gap-2">
        <Link href="/invoices">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{invoice.invoice_number}</h1>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {/* Paid warning */}
      {isPaid && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
          <Lock className="w-4 h-4 shrink-0" />
          This invoice is marked as paid. To make changes, reopen it first.
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <a href={`/api/invoices/${id}/pdf`} download target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            PDF
          </Button>
        </a>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyShareLink}>
          <ExternalLink className="w-3.5 h-3.5 text-primary" />
          Share Link
        </Button>

        <a href={`/pay/${id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Client View
          </Button>
        </a>

        {invoice.clients?.email && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send to Client
          </Button>
        )}

        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDuplicate} disabled={duplicating}>
          {duplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
          Duplicate
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" />
          Print
        </Button>

        {!isPaid && (
          <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white" onClick={handleMarkPaid} disabled={isPending}>
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Mark Paid
          </Button>
        )}
        {isPaid && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleMarkUnpaid} disabled={isPending}>
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Reopen
          </Button>
        )}
        {!isPaid && (
          <Link href={`/invoices/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </Link>
        )}
        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>

      {/* Invoice Card */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          {/* Invoice Header */}
          <div className="p-6 sm:p-8 border-b border-border/50 flex flex-col sm:flex-row justify-between gap-6">
            <div>
              <p className="text-2xl font-bold text-primary mb-1">INVOICE</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="font-mono font-medium text-foreground">{invoice.invoice_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Issued: {formatDate(invoice.issue_date)}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Due: {formatDate(invoice.due_date)}
                </div>
              </div>
            </div>
            <div className="text-sm text-right">
              <p className="font-bold text-lg text-foreground">Invoicer</p>
              <p className="text-muted-foreground">Your freelance business</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="p-6 sm:p-8 border-b border-border/50">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Bill To</p>
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-base">{invoice.clients?.name}</p>
              {invoice.clients?.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />{invoice.clients.email}
                </div>
              )}
              {invoice.clients?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />{invoice.clients.phone}
                </div>
              )}
              {invoice.clients?.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{invoice.clients.address}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="p-6 sm:p-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</th>
                  <th className="text-right pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Qty</th>
                  <th className="text-right pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Rate</th>
                  <th className="text-right pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {(invoice.invoice_items || []).map(item => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4">{item.description}</td>
                    <td className="py-3 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end mt-4 pt-4 border-t border-border/50">
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Due</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(invoice.total)}</p>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            <div className="mt-8 text-center text-xs text-muted-foreground/60">
              Thank you for your business!
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently delete <span className="font-medium text-foreground">{invoice.invoice_number}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
