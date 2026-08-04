'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  startTimer,
  stopTimer,
  createManualTimeEntry,
  deleteTimeEntry,
} from '@/lib/db/time'
import { convertTimeToInvoice } from '@/lib/time-to-invoice'
import { requireOwnership } from '@/lib/utils/ownership'

export async function startTimerAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const client_id = (formData.get('client_id') as string) || undefined
    const description = (formData.get('description') as string) || undefined

    // Validate client ownership if client_id is provided
    if (client_id) {
      await requireOwnership(supabase, user.id, client_id, 'clients')
    }

    await startTimer(supabase, { client_id, description })
    revalidatePath('/time')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to start timer' }
  }
}

export async function stopTimerAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // OWNERSHIP VALIDATION
    await requireOwnership(supabase, user.id, id, 'time_entries', 'user_id')

    await stopTimer(supabase, id)
    revalidatePath('/time')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to stop timer' }
  }
}

export async function createManualTimeEntryAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const client_id = (formData.get('client_id') as string) || undefined
    const description = (formData.get('description') as string) || undefined
    const started_at = (formData.get('started_at') as string) || new Date().toISOString()
    const hours = parseFloat((formData.get('hours') as string) || '0')
    const minutes = parseFloat((formData.get('minutes') as string) || '0')

    const totalMinutes = Math.round(hours * 60 + minutes)
    if (totalMinutes <= 0) {
      return { error: 'Please enter a duration greater than 0' }
    }

    // Validate client ownership if client_id is provided
    if (client_id) {
      await requireOwnership(supabase, user.id, client_id, 'clients')
    }

    await createManualTimeEntry(supabase, {
      client_id,
      description,
      started_at,
      duration_minutes: totalMinutes,
    })

    revalidatePath('/time')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to create time entry' }
  }
}

export async function deleteTimeEntryAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // OWNERSHIP VALIDATION
    await requireOwnership(supabase, user.id, id, 'time_entries', 'user_id')

    await deleteTimeEntry(supabase, id)
    revalidatePath('/time')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete entry' }
  }
}

export async function convertTimeEntriesToInvoiceAction(clientId: string, timeEntryIds: string[]) {
  let invoiceId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // OWNERSHIP VALIDATION
    // Validate client ownership
    await requireOwnership(supabase, user.id, clientId, 'clients')

    // Validate ownership of all time entries
    for (const timeEntryId of timeEntryIds) {
      await requireOwnership(supabase, user.id, timeEntryId, 'time_entries')
    }

    const res = await convertTimeToInvoice(supabase, {
      clientId,
      timeEntryIds,
    })
    invoiceId = res.invoiceId
    revalidatePath('/time')
    revalidatePath('/invoices')
    revalidatePath('/dashboard')
  } catch (err: any) {
    return { error: err?.message || 'Failed to convert time entries to invoice' }
  }

  if (invoiceId) {
    redirect(`/invoices/${invoiceId}`)
  }
  return { success: true }
}
