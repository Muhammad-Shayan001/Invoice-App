'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createExpense, deleteExpense } from '@/lib/db/expenses'
import { requireOwnership } from '@/lib/utils/ownership'

export async function createExpenseAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const title = (formData.get('title') as string)?.trim()
    const amount = parseFloat((formData.get('amount') as string) || '0')
    const category = (formData.get('category') as string) || 'General'
    const date = (formData.get('date') as string) || new Date().toISOString().split('T')[0]
    const notes = (formData.get('notes') as string) || undefined

    if (!title || amount <= 0) {
      return { error: 'Please provide a title and valid expense amount' }
    }

    await createExpense(supabase, { title, amount, category, date, notes })
    revalidatePath('/tools/expenses')
    revalidatePath('/tools/rate-calculator')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to add expense' }
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // OWNERSHIP VALIDATION
    await requireOwnership(supabase, user.id, id, 'expenses', 'user_id')

    await deleteExpense(supabase, id)
    revalidatePath('/tools/expenses')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete expense' }
  }
}
