"use client"

import { useEffect, useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { updateSettingsAction, changePasswordAction } from '@/app/(app)/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle, CheckCircle, User, Building2, Lock } from 'lucide-react'
import { useToast } from '@/components/toast'
import type { Profile } from '@/types/database'

function SubmitBtn({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="gap-2 w-full sm:w-auto">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{pendingLabel}</> : label}
    </Button>
  )
}

function ProfileForm({ profile }: { profile: Profile | null }) {
  const toast = useToast()
  const [state, formAction] = useActionState(updateSettingsAction, {})

  useEffect(() => {
    if (state?.success) toast.success('Profile saved!')
    if (state?.error) toast.error(state.error)
  }, [state?.success, state?.error])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="w-4 h-4 text-primary" />
          Business Profile
        </CardTitle>
        <CardDescription>Used on your invoices and emails</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{state.error}
            </div>
          )}
          {state?.success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              <CheckCircle className="w-4 h-4 shrink-0" />Profile saved successfully!
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Your Name</Label>
            <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business Name</Label>
            <Input id="business_name" name="business_name" defaultValue={profile?.business_name ?? ''} placeholder="Smith Design Studio" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default_notes">Default Invoice Notes</Label>
            <Textarea
              id="default_notes"
              name="default_notes"
              defaultValue={(profile as Profile & { default_notes?: string })?.default_notes ?? ''}
              placeholder="Payment due within 30 days. Bank transfer preferred."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Added automatically to new invoices</p>
          </div>
          <div className="flex justify-end">
            <SubmitBtn label="Save Profile" pendingLabel="Saving…" />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordForm() {
  const toast = useToast()
  const [state, formAction] = useActionState(changePasswordAction, {})

  useEffect(() => {
    if (state?.success) toast.success('Password changed successfully!')
    if (state?.error) toast.error(state.error)
  }, [state?.success, state?.error])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="w-4 h-4 text-primary" />
          Change Password
        </CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{state.error}
            </div>
          )}
          {state?.success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              <CheckCircle className="w-4 h-4 shrink-0" />Password changed!
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="new_password">New Password</Label>
            <Input id="new_password" name="new_password" type="password" minLength={8} required autoComplete="new-password" />
            <p className="text-xs text-muted-foreground">At least 8 characters</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input id="confirm_password" name="confirm_password" type="password" required autoComplete="new-password" />
          </div>
          <div className="flex justify-end">
            <SubmitBtn label="Change Password" pendingLabel="Changing…" />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('*').single().then(({ data }) => {
      setProfile(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {loading ? (
        <div className="space-y-5">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      ) : (
        <>
          <ProfileForm profile={profile} />
          <PasswordForm />
        </>
      )}
    </div>
  )
}
