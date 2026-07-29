"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  DollarSign, Clock, AlertCircle, Users, Plus, ChevronRight, FileText,
  TrendingUp, TrendingDown, CheckCircle, UserPlus, Sparkles, ArrowRight
} from 'lucide-react'
import type { DashboardStats, MonthlyEarning, InvoiceWithDetails } from '@/types/database'
import { computeStatus, computeTotal, formatCurrency, formatDate } from '@/lib/db/invoices'

function StatusBadge({ status }: { status: 'paid' | 'unpaid' | 'overdue' }) {
  const cls = { paid: 'status-paid', unpaid: 'status-unpaid', overdue: 'status-overdue' }[status]
  return (
    <span className={`${cls} px-2 py-0.5 rounded-md text-xs font-medium capitalize`}>
      {status}
    </span>
  )
}

function StatCard({ title, value, icon: Icon, description, colorClass, bgClass, trend }: {
  title: string; value: string; icon: React.ElementType; description: string; colorClass: string; bgClass: string; trend?: { val: string; isUp: boolean }
}) {
  return (
    <Card className="border-border/50 shadow-sm hover:border-border transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend.isUp ? 'text-green-400' : 'text-amber-400'}`}>
              {trend.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {trend.val}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthly, setMonthly] = useState<MonthlyEarning[]>([])
  const [recent, setRecent] = useState<InvoiceWithDetails[]>([])
  const [topClients, setTopClients] = useState<{ id: string; name: string; amount: number; invoiceCount: number }[]>([])
  const [statusCounts, setStatusCounts] = useState<{ name: string; value: number; color: string }[]>([])
  const [momGrowth, setMomGrowth] = useState<{ val: string; isUp: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [{ data: invoices }, { data: clientsData }] = await Promise.all([
        supabase.from('invoices').select('id, status, due_date, created_at, client_id, clients(id, name), invoice_items(quantity, unit_price)'),
        supabase.from('clients').select('id, name'),
      ])

      let totalEarned = 0
      let pendingAmount = 0
      let overdueCount = 0
      let paidCount = 0
      let unpaidCount = 0

      const clientSpendMap: Record<string, { name: string; amount: number; count: number }> = {}

      for (const c of clientsData || []) {
        clientSpendMap[c.id] = { name: c.name, amount: 0, count: 0 }
      }

      for (const inv of invoices || []) {
        const effectiveStatus = computeStatus(inv.status, inv.due_date)
        const total = (inv.invoice_items || []).reduce(
          (s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0
        )

        if (inv.client_id && clientSpendMap[inv.client_id]) {
          clientSpendMap[inv.client_id].amount += total
          clientSpendMap[inv.client_id].count += 1
        }

        if (effectiveStatus === 'paid') {
          totalEarned += total
          paidCount++
        } else if (effectiveStatus === 'unpaid') {
          pendingAmount += total
          unpaidCount++
        } else if (effectiveStatus === 'overdue') {
          overdueCount++
        }
      }

      setStats({ totalEarned, pendingAmount, overdueCount, totalClients: clientsData?.length || 0 })

      setStatusCounts([
        { name: 'Paid', value: paidCount, color: '#22c55e' },
        { name: 'Unpaid', value: unpaidCount, color: '#f59e0b' },
        { name: 'Overdue', value: overdueCount, color: '#ef4444' },
      ])

      // Top clients leaderboard
      const sortedClients = Object.entries(clientSpendMap)
        .map(([id, val]) => ({ id, name: val.name, amount: val.amount, invoiceCount: val.count }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4)

      setTopClients(sortedClients)

      // Monthly earnings - last 6 months
      const months: MonthlyEarning[] = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const start = d.toISOString().split('T')[0]
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().split('T')[0]
        const monthInvoices = (invoices || []).filter(inv => {
          const created = inv.created_at.split('T')[0]
          return inv.status === 'paid' && created >= start && created < end
        })
        const earnings = monthInvoices.reduce((sum, inv) => {
          return sum + (inv.invoice_items || []).reduce(
            (s: number, item: { quantity: number; unit_price: number }) => s + item.quantity * item.unit_price, 0
          )
        }, 0)
        months.push({ month: start, label: d.toLocaleDateString('en-US', { month: 'short' }), earnings })
      }
      setMonthly(months)

      // Month-over-Month calculation
      if (months.length >= 2) {
        const currentMonth = months[months.length - 1].earnings
        const prevMonth = months[months.length - 2].earnings
        if (prevMonth === 0) {
          setMomGrowth(currentMonth > 0 ? { val: '+100%', isUp: true } : null)
        } else {
          const pct = Math.round(((currentMonth - prevMonth) / prevMonth) * 100)
          setMomGrowth({ val: `${pct >= 0 ? '+' : ''}${pct}%`, isUp: pct >= 0 })
        }
      }

      // Recent invoices
      const { data: recentData } = await supabase
        .from('invoices')
        .select('*, clients(id, name, email, address, phone), invoice_items(id, description, quantity, unit_price)')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecent((recentData || []).map(inv => ({
        ...inv,
        status: computeStatus(inv.status, inv.due_date),
        total: computeTotal(inv.invoice_items || []),
      })))

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const isNewUser = (stats?.totalClients || 0) === 0 && recent.length === 0

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your business at a glance</p>
        </div>
        <Link href="/invoices/new">
          <Button size="sm" className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Onboarding Guide for New Accounts */}
      {isNewUser && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-background to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Sparkles className="w-5 h-5" />
              <span>Welcome to Invoicer! Get paid in 3 quick steps:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Link href="/clients" className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">1. Add a Client</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Save client contact info</p>
                  </div>
                </div>
              </Link>

              <Link href="/invoices/new" className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">2. Create Invoice</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Add line items & total</p>
                  </div>
                </div>
              </Link>

              <div className="p-4 rounded-xl border border-border/60 bg-card/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/15 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">3. Get Paid</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Send PDF or share link</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earned"
          value={formatCurrency(stats?.totalEarned || 0)}
          icon={DollarSign}
          description="From paid invoices"
          colorClass="text-green-400"
          bgClass="bg-green-500/10"
          trend={momGrowth || undefined}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(stats?.pendingAmount || 0)}
          icon={Clock}
          description="Awaiting payment"
          colorClass="text-amber-400"
          bgClass="bg-amber-500/10"
        />
        <StatCard
          title="Overdue"
          value={String(stats?.overdueCount || 0)}
          icon={AlertCircle}
          description="Past due date"
          colorClass="text-red-400"
          bgClass="bg-red-500/10"
        />
        <StatCard
          title="Clients"
          value={String(stats?.totalClients || 0)}
          icon={Users}
          description="Total active clients"
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Bar Chart */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
            <CardDescription className="text-xs">Income from paid invoices over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthly.every(m => m.earnings === 0) ? (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground text-sm">
                <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                No paid invoices yet — earnings chart will appear here.
              </div>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Earned']}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status Donut Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Invoice Status Breakdown</CardTitle>
            <CardDescription className="text-xs">Distribution of invoice states</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {statusCounts.every(s => s.value === 0) ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-xs">
                No invoices created yet.
              </div>
            ) : (
              <div style={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val} invoice(s)`, 'Count']}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard & Recent Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Clients Leaderboard */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Top Clients</CardTitle>
            <Link href="/clients">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No client spend data yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topClients.map((client, idx) => (
                  <div key={client.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground shrink-0">{formatCurrency(client.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="font-medium text-sm">No invoices yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first invoice to get started</p>
                <Link href="/invoices/new">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    New Invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recent.map(inv => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{inv.clients?.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{inv.invoice_number}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={inv.status} />
                      <span className="text-sm font-semibold">{formatCurrency(inv.total)}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(inv.due_date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
