import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Receipt, Users, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 lg:px-8 h-16 flex items-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link className="flex items-center justify-center" href="/">
          <Receipt className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold tracking-tight">Invoicer</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
            Login
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
            Now available in Beta
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Freelance invoicing, <span className="text-primary">simplified.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Manage your clients, send professional PDF invoices, and track your earnings in one beautiful, secure platform built specifically for freelancers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-5xl mx-auto text-left">
          <div className="flex flex-col p-6 bg-card border rounded-2xl shadow-sm">
            <Users className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">Client Manager</h3>
            <p className="text-muted-foreground flex-1">Keep track of all your clients, their contact information, and billing history in one unified view.</p>
          </div>
          <div className="flex flex-col p-6 bg-card border rounded-2xl shadow-sm">
            <Receipt className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">Smart Invoicing</h3>
            <p className="text-muted-foreground flex-1">Create itemized invoices, generate PDFs on the fly, and send them directly to clients via email.</p>
          </div>
          <div className="flex flex-col p-6 bg-card border rounded-2xl shadow-sm">
            <TrendingUp className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">Earnings Dashboard</h3>
            <p className="text-muted-foreground flex-1">Visualize your income, track pending payments, and never miss an overdue invoice again.</p>
          </div>
        </div>
      </main>
      <footer className="py-6 w-full shrink-0 items-center px-4 md:px-6 border-t flex flex-col sm:flex-row justify-between text-muted-foreground">
        <p className="text-xs">© 2026 Invoicer. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6 mt-4 sm:mt-0">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}