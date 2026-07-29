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
        error.message.includes('invalid_credentials') ||
        error.message.includes('Invalid email or password')
      ) {
        return { error: 'Incorrect email or password. Please try again.' }
      }
      if (
        error.message.includes('Email not confirmed') ||
        error.message.includes('email_not_confirmed')
      ) {
        return { error: 'Your email is not confirmed yet. Please check your inbox or sign up again.' }
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
        error.message.includes('already been registered') ||
        error.message.includes('already registered')
      ) {
        return { error: 'An account with this email already exists. Please sign in instead.' }
      }
      if (error.message.includes('rate limit') || error.message.includes('email rate limit')) {
        // Rate limit hit — the account IS created, try signing in directly
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        })
        if (!loginErr) {
          // Signed in successfully — fall through to redirect
        } else {
          return { success: true } // Account created, email pending
        }
      } else {
        return { error: error.message }
      }
    }

    // If email confirmation is ON and no session yet → show "check email" screen
    if (data?.user && !data?.session) {
      return { success: true }
    }

    // If session exists (email confirmation OFF) → redirect to dashboard immediately
    if (data?.session) {
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    }

    return { success: true }
  } catch (err: any) {
    // Check if the error is actually a redirect (Next.js throws redirects as errors)
    if ((err as any)?.digest?.startsWith('NEXT_REDIRECT')) throw err
    console.error('Signup error:', err)
    return { error: err?.message || 'An unexpected error occurred. Please try again.' }
  }
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
