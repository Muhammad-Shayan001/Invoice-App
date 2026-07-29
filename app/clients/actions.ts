'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
})

export async function createClientAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = clientSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || undefined,
    phone: formData.get('phone') || undefined,
    address: formData.get('address') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.errors[0].message }

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
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = clientSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || undefined,
    phone: formData.get('phone') || undefined,
    address: formData.get('address') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('clients').update({
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
  }).eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('clients').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}
