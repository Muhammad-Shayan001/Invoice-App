"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { exportToCSV } from '@/lib/utils/csv'
import { computeStatus, computeTotal, formatCurrency, formatDate } from '@/lib/db/invoices'
import { useToast } from '@/components/toast'
import {
  BarChart3, DollarSign, Clock, TrendingUp, Download, FileText,
  Users, AlertTriangle, CheckCircle, Calendar, Zap,
} from 'lucide-react'
import Link from 'next/link'

interface MonthlyData {
  month: string
  label: string
  earned: number
  invoices: number
}

interface ReportData {
  totalEarned: number
  pendingAmount: number
  overdueAmount: number
  overdueCount: number
  totalInvoices: number
  paidInvoices: number
  totalClients: number
  activeClients: number
  totalHours: number
  billedHours: number
  unbilledHours: number
  averageInvoiceValue: number
  monthly: MonthlyData[]
  topClients: { name: string; billed: number; invoices: number }[]
  recentInvoices: { id: string; invoice_number: string; clientName: string; total: number; status: string; due_date: string }[]
  expenseTotal: number
  categories: { category: string; amount: number }[]
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">{label}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

const BAR_COLORS = [
  'bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500',
  'bg-pink-500', 'bg-lime-500',
]

export default function ReportsPage() {
  const toast = useToast()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()

    const [
      { data: invoices },
      { data: clients },
      { data: timeEntries },
      { data: expenses },
    ] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, invoice_number, status, due_date, created_at, client_id, clients(id, name), invoice_items(quantity, unit_price)')
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name, archived'),
      supabase.from('time_entries').select('id, duration_minutes, billed, client_id, clients(name)'),
      supabase.from('expenses').select('id, amount, category, date'),
    ])

    // Invoice stats
    let totalEarned = 0, pendingAmount = 0, overdueAmount = 0, overdueCount = 0, paidInvoices = 0
    const monthlyMap: Record<string, MonthlyData> = {}
    const clientBilledMap: Record<string, { name: string; billed: number; invoices: number }> = {}

    const recentInvoices: ReportData['recentInvoices'] = []

    for (const inv of invoices || []) {
      const total = computeTotal(inv.invoice_items || [])
      const status = computeStatus(inv.status, inv.due_date)
      const monthKey = inv.created_at?.slice(0, 7) || 'unknown'
      const label = monthKey !== 'unknown'
        ? new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown'

      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { month: monthKey, label, earned: 0, invoices: 0 }
      monthlyMap[monthKey].invoices++

      if (status === 'paid') {
        totalEarned += total
        paidInvoices++
        monthlyMap[monthKey].earned += total
      } else {
        pendingAmount += total
        if (status === 'overdue') { overdueAmount += total; overdueCount++ }
      }

      // Top clients
      const clientId = (inv as any).client_id
      const clientName = (inv as any).clients?.name || 'Unknown'
      if (!clientBilledMap[clientId]) clientBilledMap[clientId] = { name: clientName, billed: 0, invoices: 0 }
      clientBilledMap[clientId].billed += total
      clientBilledMap[clientId].invoices++

      if (recentInvoices.length < 8) {
        recentInvoices.push({
          id: inv.id,
          invoice_number: inv.invoice_number,
          clientName,
          total,
          status,
          due_date: inv.due_date,
        })
      }
    }

    // Monthly — last 12 months
    const monthly: MonthlyData[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthly.push(monthlyMap[key] || { month: key, label, earned: 0, invoices: 0 })
    }

    // Time stats
    let totalMinutes = 0, billedMinutes = 0
    for (const e of timeEntries || []) {
      const mins = e.duration_minutes || 0
      totalMinutes += mins
      if (e.billed) billedMinutes += mins
    }

    // Expense categories
    const catMap: Record<string, number> = {}
    let expenseTotal = 0
    for (const exp of expenses || []) {
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount
      expenseTotal += exp.amount
    }
    const categories = Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    const allClients = clients || []
    const activeClients = allClients.filter((c: any) => !c.archived)

    setData({
      totalEarned,
      pendingAmount,
      overdueAmount,
      overdueCount,
      totalInvoices: (invoices || []).length,
      paidInvoices,
      totalClients: allClients.length,
      activeClients: activeClients.length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      billedHours: Math.round((billedMinutes / 60) * 10) / 10,
      unbilledHours: Math.round(((totalMinutes - billedMinutes) / 60) * 10) / 10,
      averageInvoiceValue: paidInvoices > 0 ? Math.round(totalEarned / paidInvoices) : 0,
      monthly,
      topClients: Object.values(clientBilledMap).sort((a, b) => b.billed - a.billed).slice(0, 5),
      recentInvoices,
      expenseTotal,
      categories,
    })
    setLoading(false)
  }

  const handleExportReport = () => {
    if (!data) return
    exportToCSV('suite_report', data.recentInvoices, [
      { key: 'invoice_number', label: 'Invoice #' },
      { key: 'clientName', label: 'Client' },
      { key: 'total', label: 'Amount ($)', transform: v => String(v) },
      { key: 'status', label: 'Status' },
      { key: 'due_date', label: 'Due Date' },
    ])
    toast.success('Report exported to CSV!')
  }

  const maxMonthlyEarning = data ? Math.max(...data.monthly.map(m => m.earned), 1) : 1
  const maxClientBilled = data ? Math.max(...data.topClients.map(c => c.billed), 1) : 1
  const maxExpense = data ? Math.max(...data.categories.map(c => c.amount), 1) : 1

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <BarChart3 className="w-4 h-4" /> Unified Reports
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Suite Analytics</h1>
          <p className="text-sm text-muted-foreground">Revenue, time, clients, and expenses — all in one view.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportReport} disabled={loading || !data}>
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Total Earned" value={formatCurrency(data?.totalEarned || 0)} sub={`${data?.paidInvoices} paid invoices`} icon={DollarSign} color="bg-green-500/15 text-green-400" />
            <StatCard label="Pending" value={formatCurrency(data?.pendingAmount || 0)} sub={`${(data?.totalInvoices || 0) - (data?.paidInvoices || 0)} unpaid`} icon={FileText} color="bg-blue-500/15 text-blue-400" />
            <StatCard label="Overdue" value={formatCurrency(data?.overdueAmount || 0)} sub={`${data?.overdueCount || 0} overdue invoices`} icon={AlertTriangle} color="bg-destructive/15 text-destructive" />
            <StatCard label="Avg Invoice" value={formatCurrency(data?.averageInvoiceValue || 0)} sub="From paid invoices" icon={TrendingUp} color="bg-primary/15 text-primary" />
            <StatCard label="Total Hours" value={`${data?.totalHours || 0}h`} sub={`${data?.billedHours || 0}h billed`} icon={Clock} color="bg-amber-500/15 text-amber-400" />
            <StatCard label="Unbilled Hours" value={`${data?.unbilledHours || 0}h`} sub="Ready to invoice" icon={Zap} color="bg-orange-500/15 text-orange-400" />
            <StatCard label="Active Clients" value={String(data?.activeClients || 0)} sub={`${data?.totalClients || 0} total (incl. archived)`} icon={Users} color="bg-purple-500/15 text-purple-400" />
            <StatCard label="Expenses" value={formatCurrency(data?.expenseTotal || 0)} sub={`${data?.categories.length || 0} categories`} icon={Calendar} color="bg-rose-500/15 text-rose-400" />
          </>
        )}
      </div>

      {/* Monthly Earnings Chart */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Monthly Revenue (Last 12 Months)
          </CardTitle>
          <CardDescription className="text-xs">Earnings from paid invoices per month</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="flex items-end gap-1 h-40">
              {data?.monthly.map((m, i) => {
                const height = Math.max(4, (m.earned / maxMonthlyEarning) * 100)
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full">
                      {m.earned > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border border-border text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                          {formatCurrency(m.earned)}
                        </div>
                      )}
                    </div>
                    <div
                      className={`w-full rounded-t-sm ${m.earned > 0 ? 'bg-primary' : 'bg-muted/50'} transition-all duration-300 hover:opacity-80`}
                      style={{ height: `${height}%` }}
                      title={`${m.label}: ${formatCurrency(m.earned)}`}
                    />
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                      {m.label.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Top Clients by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : data?.topClients.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No client revenue data yet.</p>
            ) : (
              data?.topClients.map((client, i) => (
                <div key={client.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate max-w-[60%]">{client.name}</span>
                    <span className="font-mono text-foreground">{formatCurrency(client.billed)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]} transition-all`}
                      style={{ width: `${(client.billed / maxClientBilled) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{client.invoices} invoice{client.invoices !== 1 ? 's' : ''}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Expense Breakdown
            </CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs">By category</CardDescription>
              <Link href="/tools/expenses" className="text-xs text-primary hover:underline">
                Manage →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : data?.categories.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">No expenses logged yet.</p>
                <Link href="/tools/expenses" className="text-xs text-primary hover:underline mt-2 block">
                  Log your first expense →
                </Link>
              </div>
            ) : (
              data?.categories.map((cat, i) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium capitalize">{cat.category}</span>
                    <span className="font-mono">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[(i + 4) % BAR_COLORS.length]} transition-all`}
                      style={{ width: `${(cat.amount / maxExpense) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
          <Link href="/invoices" className="text-xs text-primary hover:underline font-medium">View all</Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : data?.recentInvoices.length === 0 ? (
            <p className="p-8 text-center text-xs text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="divide-y divide-border/40 text-xs">
              {data?.recentInvoices.map(inv => {
                const statusCls: Record<string, string> = {
                  paid: 'bg-green-500/15 text-green-400',
                  unpaid: 'bg-blue-500/15 text-blue-400',
                  overdue: 'bg-destructive/15 text-destructive',
                }
                return (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors block"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{inv.invoice_number}</div>
                      <div className="text-muted-foreground text-[11px]">{inv.clientName} · Due {formatDate(inv.due_date)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${statusCls[inv.status] || ''}`}>
                        {inv.status}
                      </span>
                      <span className="font-mono font-bold text-sm text-foreground">{formatCurrency(inv.total)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
