'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { generateInvoiceNumber } from '@/lib/db/invoices'

const itemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or greater'),
})

const invoiceSchema = z.object({
  client_id: z.string().uuid('Select a client'),
  issue_date: z.string().min(1, 'Issue date required'),
  due_date: z.string().min(1, 'Due date required'),
  notes: z.string().optional(),
})

export async function createInvoiceAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = invoiceSchema.safeParse({
    client_id: formData.get('client_id'),
    issue_date: formData.get('issue_date'),
    due_date: formData.get('due_date'),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.errors[0].message }

  // Parse items from JSON
  let items: z.infer<typeof itemSchema>[] = []
  try {
    const raw = JSON.parse(formData.get('items') as string || '[]')
    const itemsParsed = z.array(itemSchema).safeParse(raw)
    if (!itemsParsed.success) return { error: 'Invalid line items: ' + itemsParsed.error.errors[0].message }
    items = itemsParsed.data
  } catch {
    return { error: 'Invalid items format' }
  }

  if (items.length === 0) return { error: 'Add at least one line item' }

  const invoice_number = await generateInvoiceNumber(supabase)

  const { data: invoice, error } = await supabase.from('invoices').insert({
    user_id: user.id,
    client_id: parsed.data.client_id,
    invoice_number,
    issue_date: parsed.data.issue_date,
    due_date: parsed.data.due_date,
    notes: parsed.data.notes || null,
    status: 'unpaid',
  }).select('id').single()

  if (error) return { error: error.message }

  const { error: itemsError } = await supabase.from('invoice_items').insert(
    items.map(item => ({ invoice_id: invoice.id, ...item }))
  )
  if (itemsError) return { error: itemsError.message }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  redirect(`/invoices/${invoice.id}`)
}

export async function updateInvoiceAction(
  id: string,
  prevState: { error?: string; success?: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check invoice is not paid
  const { data: existing } = await supabase.from('invoices').select('status').eq('id', id).single()
  if (existing?.status === 'paid') return { error: 'Cannot edit a paid invoice. Reopen it first.' }

  const parsed = invoiceSchema.safeParse({
    client_id: formData.get('client_id'),
    issue_date: formData.get('issue_date'),
    due_date: formData.get('due_date'),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.errors[0].message }

  let items: z.infer<typeof itemSchema>[] = []
  try {
    const raw = JSON.parse(formData.get('items') as string || '[]')
    const itemsParsed = z.array(itemSchema).safeParse(raw)
    if (!itemsParsed.success) return { error: 'Invalid line items' }
    items = itemsParsed.data
  } catch {
    return { error: 'Invalid items format' }
  }

  if (items.length === 0) return { error: 'Add at least one line item' }

  const { error } = await supabase.from('invoices').update({
    client_id: parsed.data.client_id,
    issue_date: parsed.data.issue_date,
    due_date: parsed.data.due_date,
    notes: parsed.data.notes || null,
  }).eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }

  // Replace items
  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  const { error: itemsError } = await supabase.from('invoice_items').insert(
    items.map(item => ({ invoice_id: id, ...item }))
  )
  if (itemsError) return { error: itemsError.message }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  revalidatePath('/dashboard')
  redirect(`/invoices/${id}`)
}

export async function deleteInvoiceAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markInvoicePaidAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath(`/invoices/${id}`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markInvoiceUnpaidAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('invoices').update({ status: 'unpaid' }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath(`/invoices/${id}`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  return { success: true }
}
