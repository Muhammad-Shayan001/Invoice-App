"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, Clock, AlertCircle, Users, Plus, ChevronRight, FileText,
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

function StatCard({ title, value, icon: Icon, description, colorClass, bgClass }: {
  title: string; value: string; icon: React.ElementType; description: string; colorClass: string; bgClass: string
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthly, setMonthly] = useState<MonthlyEarning[]>([])
  const [recent, setRecent] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Fetch all invoices with items
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, status, due_date, created_at, invoice_items(quantity, unit_price)')

      // Fetch clients count
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      let totalEarned = 0
      let pendingAmount = 0
      let overdueCount = 0

      for (const inv of invoices || []) {
        const effectiveStatus = computeStatus(inv.status, inv.due_date)
        const total = (inv.invoice_items || []).reduce(
          (s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0
        )
        if (effectiveStatus === 'paid') totalEarned += total
        else if (effectiveStatus === 'unpaid') pendingAmount += total
        else if (effectiveStatus === 'overdue') overdueCount++
      }

      setStats({ totalEarned, pendingAmount, overdueCount, totalClients: clientCount || 0 })

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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your business at a glance</p>
        </div>
        <Link href="/invoices/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earned"
          value={formatCurrency(stats?.totalEarned || 0)}
          icon={DollarSign}
          description="From paid invoices"
          colorClass="text-green-400"
          bgClass="bg-green-500/10"
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
          description="Total clients"
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
      </div>

      {/* Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.every(m => m.earnings === 0) ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No paid invoices yet — earnings will appear here.
            </div>
          ) : (
            <div style={{ height: 300 }}>
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
                  <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="border-border/50">
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
                      <div className="text-xs text-muted-foreground">{inv.invoice_number}</div>
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
  )
}
