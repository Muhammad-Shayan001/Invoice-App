'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

export async function login(
  prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const parsed = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    }).safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid input' }
    }

    const { error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error) {
      if (
        error.message.includes('Invalid login credentials') ||
        error.message.includes('invalid_credentials')
      ) {
        return { error: 'Incorrect email or password. Please try again.' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please check your email and click the confirmation link before signing in.' }
      }
      return { error: error.message }
    }
  } catch (err: any) {
    console.error('Login error:', err)
    return { error: err?.message || 'An unexpected error occurred. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()

    const parsed = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string(),
    }).refine(d => d.password === d.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }).safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid input' }
    }

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error) {
      if (
        error.message.includes('User already registered') ||
        error.message.includes('already been registered')
      ) {
        return { error: 'An account with this email already exists. Please sign in instead.' }
      }
      return { error: error.message }
    }

    // If user is created but session is null → email confirmation required
    if (data.user && !data.session) {
      return { success: true }
    }
  } catch (err: any) {
    console.error('Signup error:', err)
    return { error: err?.message || 'An unexpected error occurred. Please try again.' }
  }

  // If we have a session (email confirmation disabled), go straight to dashboard
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout(): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {}
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function forgotPassword(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()

    const email = (formData.get('email') as string)?.trim()
    if (!email) return { error: 'Email is required' }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) return { error: error.message }
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to send reset email.' }
  }
}
