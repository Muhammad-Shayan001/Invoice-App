import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <Link href="/" className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
            <Receipt className="w-8 h-8 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">Start managing your invoices for free</p>
        </div>

        <Card className="border-border/40 shadow-xl shadow-black/5">
          <form action={signup}>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Enter your details to create your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">Create Account</Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
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
