'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const settingsSchema = z.object({
  full_name: z.string().max(100).optional().or(z.literal('')),
  business_name: z.string().max(150).optional().or(z.literal('')),
  default_notes: z.string().max(1000).optional().or(z.literal('')),
})

export async function updateSettingsAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = settingsSchema.safeParse({
    full_name: formData.get('full_name') || undefined,
    business_name: formData.get('business_name') || undefined,
    default_notes: formData.get('default_notes') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: parsed.data.full_name || null,
    business_name: parsed.data.business_name || null,
    default_notes: parsed.data.default_notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function changePasswordAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
) {
  const supabase = await createClient()

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
