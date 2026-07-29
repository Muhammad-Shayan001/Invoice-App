import type { SupabaseClient } from '@supabase/supabase-js'
import { generateInvoiceNumber } from '@/lib/db/invoices'

export interface ConvertTimeOptions {
  clientId: string
  timeEntryIds: string[]
  hourlyRate?: number
  currency?: string
}

export async function convertTimeToInvoice(
  supabase: SupabaseClient,
  options: ConvertTimeOptions
): Promise<{ invoiceId: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch target time entries
  const { data: entries, error: fetchErr } = await supabase
    .from('time_entries')
    .select('*, clients(id, name, hourly_rate, currency)')
    .in('id', options.timeEntryIds)
    .eq('user_id', user.id)

  if (fetchErr || !entries || entries.length === 0) {
    throw new Error('No valid time entries found to convert')
  }

  // 2. Fetch client and user profile for fallback hourly rate & currency
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', options.clientId)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const effectiveRate =
    options.hourlyRate ||
    client?.hourly_rate ||
    profile?.default_hourly_rate ||
    50

  const effectiveCurrency =
    options.currency ||
    client?.currency ||
    profile?.default_currency ||
    'USD'

  // 3. Generate line items from time entries
  const lineItems = entries.map(entry => {
    const hours = Math.round(((entry.duration_minutes || 0) / 60) * 100) / 100
    const desc = entry.description
      ? `Time Tracked: ${entry.description}`
      : `Time Tracked (${new Date(entry.started_at).toLocaleDateString()})`

    return {
      description: desc,
      quantity: Math.max(0.01, hours),
      unit_price: effectiveRate,
      source_time_entry_ids: [entry.id],
    }
  })

  // 4. Create new invoice
  const invoiceNumber = await generateInvoiceNumber(supabase)
  const today = new Date().toISOString().split('T')[0]
  const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] // 14 days net

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: options.clientId,
      invoice_number: invoiceNumber,
      currency: effectiveCurrency,
      issue_date: today,
      due_date: dueDate,
      status: 'unpaid',
      notes: `Generated from ${entries.length} tracked time entry(ies).`,
    })
    .select('id')
    .single()

  if (invErr || !invoice) throw invErr || new Error('Failed to create invoice')

  // 5. Insert invoice line items
  const { error: itemsErr } = await supabase.from('invoice_items').insert(
    lineItems.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      source_time_entry_ids: item.source_time_entry_ids,
    }))
  )

  if (itemsErr) throw itemsErr

  // 6. Mark time entries as billed
  await supabase
    .from('time_entries')
    .update({ billed: true })
    .in('id', options.timeEntryIds)

  return { invoiceId: invoice.id }
}
