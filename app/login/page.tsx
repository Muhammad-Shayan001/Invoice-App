"use client"

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Loader2, AlertCircle } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button id="login-submit" type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Signing in…
        </>
      ) : (
        'Sign In'
      )}
    </Button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, {})

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <Link href="/" className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-3 hover:bg-primary/20 transition-colors">
            <Receipt className="w-8 h-8 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your Invoicer account</p>
        </div>

        <Card className="border-border/40 shadow-xl shadow-black/10">
          <form action={formAction}>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your email and password below</CardDescription>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/login/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <SubmitButton />
              <div className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up for free
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
