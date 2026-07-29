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
): Promise<{ error?: string; success?: boolean }> {
  let newId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const parsed = invoiceSchema.safeParse({
      client_id: formData.get('client_id'),
      issue_date: formData.get('issue_date'),
      due_date: formData.get('due_date'),
      notes: formData.get('notes') || undefined,
    })

    if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' }

    let items: z.infer<typeof itemSchema>[] = []
    try {
      const raw = JSON.parse(formData.get('items') as string || '[]')
      const itemsParsed = z.array(itemSchema).safeParse(raw)
      if (!itemsParsed.success) return { error: 'Invalid line items: ' + (itemsParsed.error.issues[0]?.message || '') }
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

    newId = invoice.id
  } catch (err: any) {
    return { error: err?.message || 'Failed to create invoice' }
  }

  if (newId) {
    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    redirect(`/invoices/${newId}`)
  }

  return {}
}

export async function updateInvoiceAction(
  id: string,
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  let redirectId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: existing } = await supabase.from('invoices').select('status').eq('id', id).single()
    if (existing?.status === 'paid') return { error: 'Cannot edit a paid invoice. Reopen it first.' }

    const parsed = invoiceSchema.safeParse({
      client_id: formData.get('client_id'),
      issue_date: formData.get('issue_date'),
      due_date: formData.get('due_date'),
      notes: formData.get('notes') || undefined,
    })

    if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' }

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

    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      items.map(item => ({ invoice_id: id, ...item }))
    )
    if (itemsError) return { error: itemsError.message }

    redirectId = id
  } catch (err: any) {
    return { error: err?.message || 'Failed to update invoice' }
  }

  if (redirectId) {
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${redirectId}`)
    revalidatePath('/dashboard')
    redirect(`/invoices/${redirectId}`)
  }

  return {}
}

export async function deleteInvoiceAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete invoice' }
  }
}

export async function duplicateInvoiceAction(id: string) {
  let newId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: source, error: fetchErr } = await supabase
      .from('invoices')
      .select('*, invoice_items(description, quantity, unit_price)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !source) return { error: 'Original invoice not found' }

    const invoice_number = await generateInvoiceNumber(supabase)
    const today = new Date().toISOString().split('T')[0]
    const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: newInvoice, error: createErr } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: source.client_id,
        invoice_number,
        issue_date: today,
        due_date: due,
        notes: source.notes,
        status: 'unpaid',
      })
      .select('id')
      .single()

    if (createErr || !newInvoice) return { error: createErr?.message || 'Failed to duplicate invoice' }

    if (source.invoice_items && source.invoice_items.length > 0) {
      const { error: itemsErr } = await supabase.from('invoice_items').insert(
        source.invoice_items.map((item: any) => ({
          invoice_id: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      )
      if (itemsErr) return { error: itemsErr.message }
    }

    newId = newInvoice.id
  } catch (err: any) {
    return { error: err?.message || 'Error duplicating invoice' }
  }

  if (newId) {
    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    redirect(`/invoices/${newId}/edit`)
  }

  return {}
}

export async function markInvoicePaidAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }

    revalidatePath(`/invoices/${id}`)
    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to mark invoice as paid' }
  }
}

export async function markInvoiceUnpaidAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase.from('invoices').update({ status: 'unpaid' }).eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }

    revalidatePath(`/invoices/${id}`)
    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to reopen invoice' }
  }
}
