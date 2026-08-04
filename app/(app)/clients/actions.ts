'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { requireOwnership } from '@/lib/utils/ownership'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
})

export async function createClientAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = clientSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || undefined,
    phone: formData.get('phone') || undefined,
    address: formData.get('address') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' }

  const { error } = await supabase.from('clients').insert({
    user_id: user.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export async function updateClientAction(
  id: string,
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // OWNERSHIP VALIDATION
  await requireOwnership(supabase, user.id, id, 'clients', 'user_id')

  const parsed = clientSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || undefined,
    phone: formData.get('phone') || undefined,
    address: formData.get('address') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' }

  const { error } = await supabase.from('clients').update({
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

/**
 * Archive a client: sets archived=true so they don't appear in normal lists.
 * All existing invoices and time entries remain intact.
 */
export async function archiveClientAction(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // OWNERSHIP VALIDATION
  await requireOwnership(supabase, user.id, id, 'clients', 'user_id')

  const { error } = await supabase
    .from('clients')
    .update({ archived: true })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Unarchive a client: restores them to the active client list.
 */
export async function unarchiveClientAction(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // OWNERSHIP VALIDATION
  await requireOwnership(supabase, user.id, id, 'clients', 'user_id')

  const { error } = await supabase
    .from('clients')
    .update({ archived: false })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

/**
 * Hard delete: removes client AND all their associated invoices / time entries.
 * Only available as a secondary action after the user has been warned.
 */
export async function deleteClientAction(id: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // OWNERSHIP VALIDATION
  await requireOwnership(supabase, user.id, id, 'clients', 'user_id')

  // Delete time entries first (no cascade in schema assumed)
  await supabase.from('time_entries').delete().eq('client_id', id)

  // Delete invoices (items cascade from invoice_id in most setups; delete invoice_items first to be safe)
  const { data: invs } = await supabase.from('invoices').select('id').eq('client_id', id)
  if (invs && invs.length > 0) {
    const ids = invs.map(i => i.id)
    await supabase.from('invoice_items').delete().in('invoice_id', ids)
    await supabase.from('invoices').delete().in('id', ids)
  }

  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  return { success: true }
}
