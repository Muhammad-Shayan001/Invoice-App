'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { requireOwnership } from '@/lib/utils/ownership'
import { isValidCurrencyCode } from '@/lib/currency'

const settingsSchema = z.object({
  full_name: z.string().max(100).optional().or(z.literal('')),
  business_name: z.string().max(150).optional().or(z.literal('')),
  default_hourly_rate: z.number().min(0).optional(),
  default_currency: z.string().optional(),
  default_notes: z.string().max(1000).optional().or(z.literal('')),
})

export async function updateSettingsAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // OWNERSHIP VALIDATION (for profile)
  await requireOwnership(supabase, user.id, user.id, 'profiles', 'id')

  const rateStr = formData.get('default_hourly_rate') as string
  const parsedRate = rateStr ? parseFloat(rateStr) : undefined

  const parsed = settingsSchema.safeParse({
    full_name: formData.get('full_name') || undefined,
    business_name: formData.get('business_name') || undefined,
    default_hourly_rate: parsedRate,
    default_currency: (formData.get('default_currency') as string) || undefined,
    default_notes: formData.get('default_notes') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' }

  // Validate currency if provided
  const currency = parsed.data.default_currency
  if (currency !== undefined && currency !== '' && !isValidCurrencyCode(currency)) {
    return { error: 'Invalid currency code' }
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: parsed.data.full_name || null,
    business_name: parsed.data.business_name || null,
    default_hourly_rate: parsed.data.default_hourly_rate ?? 50,
    default_currency: parsed.data.default_currency || 'USD',
    default_notes: parsed.data.default_notes || null,
    onboarding_completed: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/time')
  return { success: true }
}

export async function completeOnboardingAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // OWNERSHIP VALIDATION (for profile)
  await requireOwnership(supabase, user.id, user.id, 'profiles', 'id')

  const rateStr = formData.get('default_hourly_rate') as string
  const parsedRate = rateStr ? parseFloat(rateStr) : 50

  // Validate currency if provided
  const currencyForm = (formData.get('default_currency') as string) || ''
  if (currencyForm !== '' && !isValidCurrencyCode(currencyForm)) {
    return { error: 'Invalid currency code' }
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: (formData.get('full_name') as string) || null,
    business_name: (formData.get('business_name') as string) || null,
    default_hourly_rate: isNaN(parsedRate) ? 50 : parsedRate,
    default_currency: currencyForm || 'USD',
    onboarding_completed: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function changePasswordAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // OWNERSHIP VALIDATION (for user)
  await requireOwnership(supabase, user.id, user.id, 'profiles', 'id') // Using profiles table as reference for user ownership

  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords don't match" }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: true }
}
