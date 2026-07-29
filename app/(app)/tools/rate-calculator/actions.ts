'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { saveDefaultRate } from '@/lib/db/profile'

export async function saveDefaultRateAction(
  rate: number,
  calculationDetails: {
    desired_yearly_income: number
    working_days_per_year: number
    billable_hours_per_day: number
    business_expenses: number
    tax_rate_percent: number
  }
) {
  try {
    const supabase = await createClient()
    await saveDefaultRate(supabase, rate, calculationDetails)

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath('/time')
    revalidatePath('/tools/rate-calculator')

    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to save rate' }
  }
}
