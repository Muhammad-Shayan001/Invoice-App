"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Receipt, ArrowRight, Users, TrendingUp, CheckCircle, Zap, Shield, FileText } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <span>Invoicer</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-32 sm:pt-32 sm:pb-40">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary mb-8">
              <Zap className="w-3.5 h-3.5" />
              Built for freelancers
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
              Invoice smarter,{' '}
              <span className="text-primary">get paid faster.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Track every client, send polished PDF invoices, and know exactly who owes you money — all in one calm, fast, and beautifully designed app.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-8 h-12 text-base">
                  Start for free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                  Sign in to your account
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
              {[
                { icon: CheckCircle, text: '100% Private & Secure' },
                { icon: FileText, text: 'PDF Ready' },
                { icon: Shield, text: 'RLS Protected Data' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything a freelancer needs</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">No bloat. No complexity. Just the tools you actually use every week.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Users,
                  title: 'Track every client',
                  description: 'Keep all your client info — email, phone, address — in one place. See their complete invoice history at a glance.',
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                },
                {
                  icon: Receipt,
                  title: 'Send professional invoices',
                  description: 'Create itemized invoices, auto-generate PDF files, and send them directly to clients — all in a few clicks.',
                  color: 'text-primary',
                  bg: 'bg-primary/10',
                },
                {
                  icon: TrendingUp,
                  title: 'Know your numbers',
                  description: 'Dashboard shows exactly what you\'ve earned, what\'s pending, and what\'s overdue. Never lose track of a payment.',
                  color: 'text-green-400',
                  bg: 'bg-green-500/10',
                },
              ].map(({ icon: Icon, title, description, color, bg }) => (
                <div
                  key={title}
                  className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
                >
                  <div className={`inline-flex p-3 rounded-xl ${bg} mb-4`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to take control of your invoicing?</h2>
              <p className="text-muted-foreground mb-8">Free to use. No credit card required. Set up in minutes.</p>
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-10 h-12 text-base">
                  Create your free account <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Invoicer</span>
            <span>— Demo portfolio project</span>
          </div>
          <p>© {new Date().getFullYear()} Invoicer. Built with Next.js + Supabase.</p>
        </div>
      </footer>
    </div>
  )
}