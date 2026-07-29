import { createClient as createAdminClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, Clock, AlertCircle, Download, Printer, ShieldCheck, Mail, MapPin, Phone, Hash, Calendar } from 'lucide-react'
import { computeStatus, computeTotal, formatCurrency, formatDate } from '@/lib/db/invoices'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: 'paid' | 'unpaid' | 'overdue' }) {
  const cls = { paid: 'status-paid', unpaid: 'status-unpaid', overdue: 'status-overdue' }[status]
  return <span className={`${cls} px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider`}>{status}</span>
}

export default async function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Use service role client to bypass user RLS safely for this public single-invoice route
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const adminClient = createAdminClient(supabaseUrl, serviceKey)

  const { data: inv } = await adminClient
    .from('invoices')
    .select('*, clients(name, email, address, phone), invoice_items(description, quantity, unit_price), profiles(business_name, full_name, default_notes)')
    .eq('id', id)
    .single()

  if (!inv) {
    notFound()
  }

  const effectiveStatus = computeStatus(inv.status, inv.due_date)
  const total = computeTotal(inv.invoice_items || [])
  const businessName = inv.profiles?.business_name || inv.profiles?.full_name || 'Invoicer Freelancer'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-100">{businessName}</h1>
              <p className="text-xs text-slate-400">Secure Client Invoice Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/api/invoices/${id}/pdf`} download target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </a>
          </div>
        </div>

        {/* Invoice Card */}
        <Card className="border-slate-800 bg-slate-900 shadow-2xl text-slate-200 overflow-hidden">
          <CardContent className="p-0">
            {/* Top Info Banner */}
            <div className="p-6 sm:p-8 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">INVOICE</p>
                <h2 className="text-3xl font-mono font-bold text-slate-100 mb-3">{inv.invoice_number}</h2>
                <div className="space-y-1 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Issue Date: <strong className="text-slate-300">{formatDate(inv.issue_date)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Due Date: <strong className="text-slate-300">{formatDate(inv.due_date)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-between gap-3">
                <StatusBadge status={effectiveStatus} />
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400">Total Amount Due</p>
                  <p className="text-3xl font-bold text-indigo-400">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>

            {/* Parties Info */}
            <div className="p-6 sm:p-8 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Billed From</p>
                <p className="font-bold text-base text-slate-100">{businessName}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Billed To</p>
                <p className="font-bold text-base text-slate-100">{inv.clients?.name}</p>
                {inv.clients?.email && (
                  <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5" />{inv.clients.email}
                  </p>
                )}
                {inv.clients?.address && (
                  <p className="text-sm text-slate-400 flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 mt-0.5" />{inv.clients.address}
                  </p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="p-6 sm:p-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="text-left pb-3">Item Description</th>
                    <th className="text-center pb-3">Qty</th>
                    <th className="text-right pb-3">Rate</th>
                    <th className="text-right pb-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(inv.invoice_items || []).map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3.5 pr-4 text-slate-200">{item.description}</td>
                      <td className="py-3.5 text-center text-slate-400">{item.quantity}</td>
                      <td className="py-3.5 text-right text-slate-400">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3.5 text-right font-semibold text-slate-100">{formatCurrency(item.quantity * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Summary */}
              <div className="flex justify-end mt-6 pt-6 border-t border-slate-800">
                <div className="w-full sm:w-64 space-y-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-200">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-indigo-400 pt-2 border-t border-slate-800">
                    <span>Total Due</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {inv.notes && (
                <div className="mt-8 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment Instructions & Notes</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{inv.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Powered by Invoicer • Thank you for your business!
        </p>
      </div>
    </div>
  )
}
