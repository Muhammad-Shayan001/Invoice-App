import type { SupabaseClient } from '@supabase/supabase-js'
import type { InvoiceItem, InvoiceWithDetails } from '@/types/database'

// Compute effective status from stored status + due_date
export function computeStatus(status: string, due_date: string): 'paid' | 'unpaid' | 'overdue' {
  if (status === 'paid') return 'paid'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(due_date)
  due.setHours(0, 0, 0, 0)
  if (due < today) return 'overdue'
  return 'unpaid'
}

// Compute total from items
export function computeTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
}

// Format currency consistently everywhere
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// Format date for display
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export async function generateInvoiceNumber(supabase: SupabaseClient): Promise<string> {
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })

  const next = (count ?? 0) + 1
  return `INV-${String(next).padStart(4, '0')}`
}

export async function getInvoices(
  supabase: SupabaseClient,
  filters?: { status?: string; client_id?: string }
): Promise<InvoiceWithDetails[]> {
  let query = supabase
    .from('invoices')
    .select(`
      *,
      clients(id, name, email, address, phone),
      invoice_items(id, description, quantity, unit_price)
    `)
    .order('created_at', { ascending: false })

  // Apply client filter
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  // Apply status filter (overdue is computed — filter by unpaid + past due)
  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'overdue') {
      const today = new Date().toISOString().split('T')[0]
      query = query.eq('status', 'unpaid').lt('due_date', today)
    } else if (filters.status === 'unpaid') {
      const today = new Date().toISOString().split('T')[0]
      query = query.eq('status', 'unpaid').gte('due_date', today)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((inv) => ({
    ...inv,
    status: computeStatus(inv.status, inv.due_date),
    total: computeTotal(inv.invoice_items || []),
  }))
}

export async function getInvoice(supabase: SupabaseClient, id: string): Promise<InvoiceWithDetails | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients(id, name, email, address, phone),
      invoice_items(id, description, quantity, unit_price)
    `)
    .eq('id', id)
    .single()

  if (error) return null

  return {
    ...data,
    status: computeStatus(data.status, data.due_date),
    total: computeTotal(data.invoice_items || []),
  }
}

export async function createInvoice(
  supabase: SupabaseClient,
  payload: {
    client_id: string
    issue_date: string
    due_date: string
    notes?: string
    items: { description: string; quantity: number; unit_price: number }[]
  }
): Promise<{ id: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const invoice_number = await generateInvoiceNumber(supabase)

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: payload.client_id,
      invoice_number,
      issue_date: payload.issue_date,
      due_date: payload.due_date,
      notes: payload.notes || null,
      status: 'unpaid',
    })
    .select('id')
    .single()

  if (error) throw error

  if (payload.items.length > 0) {
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      payload.items.map(item => ({ invoice_id: invoice.id, ...item }))
    )
    if (itemsError) throw itemsError
  }

  return invoice
}

export async function updateInvoice(
  supabase: SupabaseClient,
  id: string,
  payload: {
    client_id?: string
    issue_date?: string
    due_date?: string
    notes?: string
    items?: { description: string; quantity: number; unit_price: number }[]
  }
): Promise<void> {
  // Update invoice fields
  const { items, ...invoiceFields } = payload
  if (Object.keys(invoiceFields).length > 0) {
    const { error } = await supabase.from('invoices').update(invoiceFields).eq('id', id)
    if (error) throw error
  }

  // Replace items
  if (items !== undefined) {
    const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', id)
    if (deleteError) throw deleteError

    if (items.length > 0) {
      const { error: insertError } = await supabase.from('invoice_items').insert(
        items.map(item => ({ invoice_id: id, ...item }))
      )
      if (insertError) throw insertError
    }
  }
}

export async function deleteInvoice(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
}

export async function markInvoicePaid(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', id)
  if (error) throw error
}

export async function markInvoiceUnpaid(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('invoices').update({ status: 'unpaid' }).eq('id', id)
  if (error) throw error
}
