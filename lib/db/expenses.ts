import type { SupabaseClient } from '@supabase/supabase-js'
import type { Expense } from '@/types/database'

export async function getExpenses(supabase: SupabaseClient): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createExpense(
  supabase: SupabaseClient,
  payload: {
    title: string
    amount: number
    category?: string
    date?: string
    notes?: string
  }
): Promise<Expense> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      title: payload.title,
      amount: payload.amount,
      category: payload.category || 'General',
      date: payload.date || new Date().toISOString().split('T')[0],
      notes: payload.notes || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteExpense(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
