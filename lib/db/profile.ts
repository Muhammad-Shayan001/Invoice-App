import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

export async function getProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') return null

  if (!data) {
    // Upsert default profile if missing
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({ id: user.id })
      .select('*')
      .single()
    return newProfile
  }

  return data
}

export async function updateProfile(
  supabase: SupabaseClient,
  updates: Partial<Profile>
): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function saveDefaultRate(
  supabase: SupabaseClient,
  rate: number,
  calculationDetails?: {
    desired_yearly_income: number
    working_days_per_year: number
    billable_hours_per_day: number
    business_expenses: number
    tax_rate_percent: number
  }
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Update profile
  await supabase
    .from('profiles')
    .upsert({ id: user.id, default_hourly_rate: rate })

  // Log calculation history if details provided
  if (calculationDetails) {
    await supabase.from('rate_calculations').insert({
      user_id: user.id,
      result_hourly_rate: rate,
      ...calculationDetails,
    })
  }
}
