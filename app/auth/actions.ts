'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

function isFetchError(err: any): boolean {
  const msg: string = (err?.message || err?.cause?.message || '').toLowerCase()
  return (
    msg.includes('fetch failed') ||
    msg.includes('econnrefused') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed')
  )
}

export async function login(
  prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  // Validate env vars before making any network call
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: 'Server configuration error: Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel project settings and redeploy.' }
  }

  let redirectTo: string | null = null

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
      if (
        error.message.includes('Email not confirmed') ||
        error.message.includes('email_not_confirmed')
      ) {
        return { error: 'Email not confirmed. Please check your inbox or disable email confirmation in Supabase.' }
      }
      return { error: error.message }
    }

    redirectTo = '/dashboard'
  } catch (err: any) {
    console.error('Login error:', err)
    if (isFetchError(err)) {
      return { error: 'Cannot reach the authentication server. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your Vercel environment variables.' }
    }
    return { error: err?.message || 'An unexpected error occurred. Please try again.' }
  }

  if (redirectTo) {
    revalidatePath('/', 'layout')
    redirect(redirectTo)
  }

  return {}
}

export async function signup(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: 'Server configuration error: Supabase environment variables are not set. Please add them to your Vercel project settings and redeploy.' }
  }

  let redirectTo: string | null = null
  let showSuccess = false

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
        // Rate limit — account may already exist, try signing in directly
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        })
        if (!loginErr) {
          redirectTo = '/dashboard'
        } else {
          showSuccess = true // Account created, but email is pending
        }
      } else {
        return { error: error.message }
      }
    } else {
      // No error from signUp
      if (data?.session) {
        // Email confirmation is OFF — user is signed in immediately
        redirectTo = '/dashboard'
      } else if (data?.user) {
        // Email confirmation is ON — show "check your email" screen
        showSuccess = true
      } else {
        return { error: 'Something went wrong. Please try again.' }
      }
    }
  } catch (err: any) {
    console.error('Signup error:', err)
    if (isFetchError(err)) {
      return { error: 'Cannot reach the authentication server. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your Vercel environment variables.' }
    }
    return { error: err?.message || 'An unexpected error occurred. Please try again.' }
  }

  // Perform redirect outside try-catch (Next.js redirect() throws internally)
  if (redirectTo) {
    revalidatePath('/', 'layout')
    redirect(redirectTo)
  }

  if (showSuccess) {
    return { success: true }
  }

  return {}
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
  let showSuccess = false

  try {
    const supabase = await createClient()

    const email = (formData.get('email') as string)?.trim()
    if (!email) return { error: 'Email is required' }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) return { error: error.message }
    showSuccess = true
  } catch (err: any) {
    if (isFetchError(err)) {
      return { error: 'Cannot reach the authentication server. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your Vercel environment variables.' }
    }
    return { error: err?.message || 'Failed to send reset email.' }
  }

  if (showSuccess) return { success: true }
  return {}
}
