import type { SupabaseClient } from '@supabase/supabase-js'
import type { Client, ClientWithStats } from '@/types/database'

export async function getClients(supabase: SupabaseClient): Promise<ClientWithStats[]> {
  // Fetch all clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  if (clientsError) throw clientsError
  if (!clients || clients.length === 0) return []

  // Fetch all invoices for these clients
  const clientIds = clients.map(c => c.id)
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*, invoice_items(quantity, unit_price)')
    .in('client_id', clientIds)

  if (invoicesError) throw invoicesError

  // Group invoices by clientId
  const invoicesByClientId: Record<string, typeof invoices> = {}
  for (const invoice of invoices || []) {
    if (!invoicesByClientId[invoice.client_id]) {
      invoicesByClientId[invoice.client_id] = []
    }
    invoicesByClientId[invoice.client_id].push(invoice)
  }

  // Process each client
  return clients.map(client => {
    const clientInvoices = invoicesByClientId[client.id] || []
    const invoiceCount = clientInvoices.length
    const totalBilled = clientInvoices.reduce((sum, inv) => {
      const invTotal = (inv.invoice_items || []).reduce(
        (s: number, item: { quantity: number; unit_price: number }) => s + (item.quantity * item.unit_price),
        0
      )
      return sum + invTotal
    }, 0)

    return {
      id: client.id,
      user_id: client.user_id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      created_at: client.created_at,
      invoice_count: invoiceCount,
      total_billed: totalBilled,
    }
  })
}

export async function getClient(supabase: SupabaseClient, id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createClient(
  supabase: SupabaseClient,
  payload: { name: string; email?: string; phone?: string; address?: string }
): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('clients')
    .insert({ user_id: user.id, ...payload })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateClient(
  supabase: SupabaseClient,
  id: string,
  payload: { name?: string; email?: string; phone?: string; address?: string }
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteClient(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) throw error
}
