import type { SupabaseClient } from '@supabase/supabase-js'
import type { Client, ClientWithStats } from '@/types/database'

export async function getClients(supabase: SupabaseClient): Promise<ClientWithStats[]> {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      invoices(
        id,
        invoice_items(quantity, unit_price)
      )
    `)
    .order('name', { ascending: true })

  if (error) throw error

  return (data || []).map((client: Client & { invoices: { id: string; invoice_items: { quantity: number; unit_price: number }[] }[] }) => {
    const invoices = client.invoices || []
    const total_billed = invoices.reduce((sum, inv) => {
      const invTotal = (inv.invoice_items || []).reduce(
        (s, item) => s + item.quantity * item.unit_price,
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
      invoice_count: invoices.length,
      total_billed,
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
