"use client"

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CurrencyWidget } from '@/components/CurrencyWidget'
import { useToast } from '@/components/toast'
import {
  DollarSign, Clock, AlertCircle, Users, Plus, ChevronRight, FileText,
  TrendingUp, CheckCircle, ArrowRight, Calculator, Globe, Sparkles
} from 'lucide-react'
import type { DashboardStats, InvoiceWithDetails } from '@/types/database'
import { computeStatus, computeTotal, formatCurrency, formatDate } from '@/lib/db/invoices'
import { getUnbilledTimeEntriesByClient } from '@/lib/db/time'
import { getProfile } from '@/lib/db/profile'
import { convertTimeEntriesToInvoiceAction } from '@/app/(app)/time/actions'

function StatusBadge({ status }: { status: 'paid' | 'unpaid' | 'overdue' }) {
  const cls = { paid: 'status-paid', unpaid: 'status-unpaid', overdue: 'status-overdue' }[status]
  return (
    <span className={`${cls} px-2 py-0.5 rounded-md text-xs font-medium capitalize`}>
      {status}
    </span>
  )
}

export default function DashboardPage() {
  const toast = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<InvoiceWithDetails[]>([])
  const [unbilledClients, setUnbilledClients] = useState<{
    client: { id: string; name: string; hourly_rate?: number; currency?: string }
    entries: any[]
    totalMinutes: number
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const loadData = async () => {
    const supabase = createClient()

    const [{ data: invoices }, { data: clientsData }, profile, unbilledGrouped] = await Promise.all([
      supabase.from('invoices').select('id, invoice_number, status, due_date, created_at, client_id, clients(id, name), invoice_items(quantity, unit_price)').order('created_at', { ascending: false }).limit(5),
      supabase.from('clients').select('id, name'),
      getProfile(supabase),
      getUnbilledTimeEntriesByClient(supabase),
    ])

    // Compute stats
    let totalEarned = 0
    let pendingAmount = 0
    let overdueCount = 0

    const { data: allInvoices } = await supabase.from('invoices').select('status, due_date, invoice_items(quantity, unit_price)')
    for (const inv of allInvoices || []) {
      const tot = computeTotal(inv.invoice_items || [])
      const st = computeStatus(inv.status, inv.due_date)
      if (st === 'paid') totalEarned += tot
      else {
        pendingAmount += tot
        if (st === 'overdue') overdueCount += 1
      }
    }

    const unbilledMins = unbilledGrouped.reduce((sum, g) => sum + g.totalMinutes, 0)

    setStats({
      totalEarned,
      pendingAmount,
      overdueCount,
      totalClients: clientsData?.length || 0,
      unbilledHours: Math.round((unbilledMins / 60) * 10) / 10,
      defaultHourlyRate: profile?.default_hourly_rate || 50,
    })

    setUnbilledClients(unbilledGrouped as any)

    setRecent(
      (invoices || []).map(inv => ({
        ...inv,
        status: computeStatus(inv.status, inv.due_date),
        total: computeTotal(inv.invoice_items || []),
      })) as any
    )

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleConvertClientTime = (clientId: string, entryIds: string[]) => {
    startTransition(async () => {
      const res = await convertTimeEntriesToInvoiceAction(clientId, entryIds)
      if (res?.error) {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suite Dashboard</h1>
          <p className="text-sm text-muted-foreground">Unified overview of your freelance client activity, time, and revenue.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/time">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Start Timer
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Earned</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/15 text-green-400"><DollarSign className="w-4 h-4" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <div className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(stats?.totalEarned || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Unbilled Hours</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400"><Clock className="w-4 h-4" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold tracking-tight text-amber-500">{stats?.unbilledHours || 0} hrs</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Ready to convert to invoice</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Pending Amount</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400"><FileText className="w-4 h-4" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <div className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(stats?.pendingAmount || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stats?.overdueCount || 0} overdue invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Your Target Rate</CardTitle>
            <div className="p-2 rounded-lg bg-primary/15 text-primary"><Calculator className="w-4 h-4" /></div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold tracking-tight text-primary">${stats?.defaultHourlyRate || 50}/hr</div>
            )}
            <Link href="/tools/rate-calculator" className="text-[11px] text-primary hover:underline mt-1 block">
              Recalculate rate →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Connective Tissue Panel: "Ready to Invoice" */}
      <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-background to-background shadow-md">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold">Ready to Invoice</CardTitle>
            </div>
            <Link href="/time" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              View Time Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <CardDescription className="text-xs">
            Tracked client hours that haven&apos;t been billed yet. Click &quot;Create Invoice from Time&quot; to generate line items automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : unbilledClients.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
              All tracked hours have been invoiced! Start a new timer in the Time Tracker whenever you work on client projects.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unbilledClients.map(group => {
                const hours = Math.round((group.totalMinutes / 60) * 10) / 10
                const estAmount = hours * (group.client.hourly_rate || stats?.defaultHourlyRate || 50)
                return (
                  <div key={group.client.id} className="p-4 rounded-xl border border-border/50 bg-card flex flex-col justify-between gap-3 shadow-sm">
                    <div>
                      <div className="font-semibold text-sm text-foreground">{group.client.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {group.entries.length} tracked entry(ies) • <strong className="text-foreground">{hours} hrs</strong>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <div className="font-mono font-bold text-sm text-primary">
                        ≈ ${estAmount.toLocaleString()} USD
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleConvertClientTime(group.client.id, group.entries.map(e => e.id))}
                        disabled={isPending}
                        className="h-8 text-xs gap-1"
                      >
                        Create Invoice
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency Converter Quick Widget & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
              <Link href="/invoices" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              ) : recent.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No invoices generated yet.</div>
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {recent.map(inv => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors block">
                      <div>
                        <div className="font-semibold text-foreground">{inv.invoice_number}</div>
                        <div className="text-muted-foreground text-[11px]">{inv.clients?.name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={inv.status} />
                        <span className="font-mono font-bold text-sm text-foreground">{formatCurrency(inv.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Currency Quick Widget on Dashboard */}
        <div className="lg:col-span-5">
          <CurrencyWidget compact={false} title="Quick Currency Converter" />
        </div>
      </div>
    </div>
  )
}
