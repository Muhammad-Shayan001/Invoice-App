import type { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardStats, MonthlyEarning, InvoiceWithDetails } from '@/types/database'
import { computeStatus, computeTotal } from './invoices'

export async function getDashboardStats(supabase: SupabaseClient): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0]

  // Get all invoices with items
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, status, due_date, invoice_items(quantity, unit_price)')

  if (error) throw error

  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('id', { count: 'exact' })

  if (clientsError) throw clientsError

  let totalEarned = 0
  let pendingAmount = 0
  let overdueCount = 0

  for (const inv of invoices || []) {
    const effectiveStatus = computeStatus(inv.status, inv.due_date)
    const total = (inv.invoice_items || []).reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0
    )

    if (effectiveStatus === 'paid') {
      totalEarned += total
    } else if (effectiveStatus === 'unpaid') {
      pendingAmount += total
    } else if (effectiveStatus === 'overdue') {
      overdueCount += 1
    }
  }

  return {
    totalEarned,
    pendingAmount,
    overdueCount,
    totalClients: clientsData?.length || 0,
  }
}

export async function getMonthlyEarnings(supabase: SupabaseClient): Promise<MonthlyEarning[]> {
  // Last 6 months
  const months: MonthlyEarning[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startOfMonth = d.toISOString().split('T')[0]
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const endOfMonth = endDate.toISOString().split('T')[0]

    const { data } = await supabase
      .from('invoices')
      .select('invoice_items(quantity, unit_price)')
      .eq('status', 'paid')
      .gte('created_at', startOfMonth)
      .lt('created_at', endOfMonth)

    const earnings = (data || []).reduce((sum, inv) => {
      const invTotal = (inv.invoice_items || []).reduce(
        (s: number, item: { quantity: number; unit_price: number }) =>
          s + item.quantity * item.unit_price,
        0
      )
      return sum + invTotal
    }, 0)

    months.push({
      month: startOfMonth,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      earnings,
    })
  }

  return months
}

export async function getRecentInvoices(supabase: SupabaseClient): Promise<InvoiceWithDetails[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients(id, name, email, address, phone),
      invoice_items(id, description, quantity, unit_price)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data || []).map(inv => ({
    ...inv,
    status: computeStatus(inv.status, inv.due_date),
    total: computeTotal(inv.invoice_items || []),
  }))
}
