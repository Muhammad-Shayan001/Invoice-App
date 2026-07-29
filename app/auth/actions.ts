'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

export async function login(prevState: { error?: string }, formData: FormData) {
  const supabase = await createClient()

  const parsed = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }).safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Incorrect email or password. Please try again.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email before signing in.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(prevState: { error?: string }, formData: FormData) {
  const supabase = await createClient()

  const parsed = z.object({
    email: z.email('Invalid email address'),
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
    return { error: parsed.error.errors[0].message }
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('User already registered')) {
      return { error: 'An account with this email already exists.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function forgotPassword(prevState: { error?: string; success?: boolean }, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) return { error: error.message }
  return { success: true }
}
