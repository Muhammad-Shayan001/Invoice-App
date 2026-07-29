"use client"

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Loader2, AlertCircle, Mail, CheckCircle2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button id="signup-submit" type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Creating account…
        </>
      ) : (
        'Create Account'
      )}
    </Button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, {})

  // Show success / email confirmation screen
  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md">
          <Card className="border-border/40 shadow-xl shadow-black/10 text-center">
            <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
              <div className="p-4 bg-green-500/10 rounded-full">
                <Mail className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-2">Check your email!</h2>
                <p className="text-muted-foreground text-sm">
                  We've sent a confirmation link to your email address.
                  <br />
                  Click the link in the email to activate your account.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/40 rounded-lg px-4 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                Account created — just needs email verification
              </div>
              <Link href="/login" className="w-full mt-2">
                <Button variant="outline" className="w-full">Go to Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <Link href="/" className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-3 hover:bg-primary/20 transition-colors">
            <Receipt className="w-8 h-8 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start managing your invoices for free</p>
        </div>

        <Card className="border-border/40 shadow-xl shadow-black/10">
          <form action={formAction}>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Enter your details to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state?.error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <SubmitButton />
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
