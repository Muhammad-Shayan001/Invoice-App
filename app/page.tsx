"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Receipt,
  ArrowRight,
  Clock,
  Globe,
  Calculator,
  FileCheck,
  FileSpreadsheet,
  Percent,
  AlertTriangle,
  Scale,
  QrCode,
  CheckCircle,
  Zap,
  Shield,
  FileText,
  Sparkles,
  Users,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-bold text-lg">Invoicer</span>
              <span className="text-[10px] text-muted-foreground font-mono ml-2">Freelancer Suite</span>
            </div>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started — It&apos;s Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/8 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              One Account • 10 Connected Freelancer Tools
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.15]">
              Everything a freelancer needs to get paid right,{' '}
              <span className="text-primary">all in one place.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Track billable hours, convert time straight into invoices, calculate your minimum target rate, convert foreign currencies, and generate legal agreements — with one single login.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/20">
                  Get Started — It&apos;s Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                  Sign in to your account
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-muted-foreground">
              {[
                { icon: CheckCircle, text: 'Single Shared Login' },
                { icon: Clock, text: 'Time Tracker → Invoice Pipeline' },
                { icon: Globe, text: 'Live Central Bank Rates' },
                { icon: Shield, text: 'Row Level Security' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 font-medium">
                  <Icon className="w-4 h-4 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core 4 Showcase */}
        <section className="py-16 px-4 sm:px-6 bg-muted/20 border-y border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Core Integrated Tools</h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                These tools share the same client list, database, and settings — work flows naturally from one to another.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FileText,
                  name: 'Invoice Generator',
                  desc: 'Create, send, and track itemized PDF invoices with custom branding and payment links.',
                },
                {
                  icon: Clock,
                  name: 'Time Tracker',
                  desc: 'Track live hours on client work and convert unbilled entries into invoices with one click.',
                },
                {
                  icon: Globe,
                  name: 'Currency Converter',
                  desc: 'Live central bank exchange rates to know exactly what foreign client payments are worth.',
                },
                {
                  icon: Calculator,
                  name: 'Hourly Rate Calculator',
                  desc: 'Calculate what you need to charge based on desired take-home income, expenses, and taxes.',
                },
              ].map(({ icon: Icon, name, desc }) => (
                <div key={name} className="p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all space-y-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base">{name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why One Account? Differentiator Section */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 sm:p-12 text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <Zap className="w-3.5 h-3.5" /> Why one account?
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                No more jumping between four disjointed apps
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                When you log time for a client in the Time Tracker, it immediately shows up on your Dashboard under <strong>&quot;Ready to Invoice&quot;</strong>. When you save a target rate in the Rate Calculator, it becomes your suite-wide default rate. Everything works as one cohesive internal tool.
              </p>
              <div className="pt-2">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 px-8">
                    Create Your Single Suite Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Specialized Suite Tools (Grid of 6) */}
        <section className="py-16 px-4 sm:px-6 bg-muted/20 border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Plus 6 Specialized Utilities</h2>
              <p className="text-muted-foreground text-sm">Every utility a freelancer needs during the client lifecycle.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: FileCheck, title: 'Proposal & Quote Generator', desc: 'Pre-sale project scope quotes ready to print or save as PDF.' },
                { icon: FileSpreadsheet, title: 'Contract Generator', desc: 'Standard freelance agreements for web dev, design, and consulting.' },
                { icon: Receipt, title: 'Expense Tracker', desc: 'Log business costs by category and export data for tax time.' },
                { icon: Percent, title: 'Tax & Income Estimator', desc: 'Know how much to set aside each month for quarterly taxes.' },
                { icon: AlertTriangle, title: 'Late Fee Calculator', desc: 'Calculate pro-rated overdue interest and copy reminder emails.' },
                { icon: QrCode, title: 'QR Payment Generator', desc: 'Scannable payment QR codes for mobile scan-to-pay on invoices.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">{title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">Invoicer Freelancer Suite</span>
          </div>
          <p>© {new Date().getFullYear()} Invoicer. Built with Next.js 16 + Supabase.</p>
        </div>
      </footer>
    </div>
  )
}