"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COMMON_CURRENCIES } from '@/lib/currency'
import { completeOnboardingAction } from '@/app/(app)/settings/actions'
import { Loader2, Sparkles, DollarSign, Globe, User, Rocket } from 'lucide-react'
import { useToast } from '@/components/toast'

interface OnboardingModalProps {
  open: boolean
  onComplete: () => void
}

const STEPS = ['welcome', 'profile', 'rate', 'done'] as const
type Step = (typeof STEPS)[number]

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [hourlyRate, setHourlyRate] = useState(50)
  const [isPending, startTransition] = useTransition()

  const handleFinish = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('full_name', name)
      fd.set('business_name', businessName)
      fd.set('default_currency', currency)
      fd.set('default_hourly_rate', String(hourlyRate))
      const res = await completeOnboardingAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Welcome aboard! Your suite is ready.')
        onComplete()
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden border-primary/20 shadow-2xl" showCloseButton={false}>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((STEPS.indexOf(step) + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-6">
          {step === 'welcome' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Welcome to Invoicer Suite</DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Let's take 60 seconds to set your defaults — every tool in the suite uses these values, so you don't have to type them again.
                </p>
              </div>
              <Button className="w-full gap-2" size="lg" onClick={() => setStep('profile')}>
                <Rocket className="w-4 h-4" /> Get Started
              </Button>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> About You
                </DialogTitle>
                <p className="text-xs text-muted-foreground">These appear on your invoices and proposals.</p>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="onb-name">Your Full Name</Label>
                  <Input
                    id="onb-name"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="onb-biz">Business Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="onb-biz"
                    placeholder="Smith Design Studio"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('welcome')}>Back</Button>
                <Button className="flex-1" onClick={() => setStep('rate')}>Next →</Button>
              </div>
            </div>
          )}

          {step === 'rate' && (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Your Defaults
                </DialogTitle>
                <p className="text-xs text-muted-foreground">Used as fallback by the Time Tracker, Rate Calculator, and Invoice generator.</p>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="onb-rate">Default Hourly Rate ($/hr)</Label>
                  <Input
                    id="onb-rate"
                    type="number"
                    min={0}
                    step={5}
                    value={hourlyRate}
                    onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-[11px] text-muted-foreground">You can change this any time in Settings or via the Rate Calculator.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="onb-currency" className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" /> Default Currency
                  </Label>
                  <select
                    id="onb-currency"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    {COMMON_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">Currency resolution: invoice-level override → client default → this account default.</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('profile')}>Back</Button>
                <Button className="flex-1" onClick={() => setStep('done')}>Next →</Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">You're all set!</DialogTitle>
                <div className="mt-3 text-left space-y-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground border border-border/50">
                  <div className="flex justify-between"><span>Name:</span><strong className="text-foreground">{name || '—'}</strong></div>
                  {businessName && <div className="flex justify-between"><span>Business:</span><strong className="text-foreground">{businessName}</strong></div>}
                  <div className="flex justify-between"><span>Default Rate:</span><strong className="text-foreground">${hourlyRate}/hr</strong></div>
                  <div className="flex justify-between"><span>Currency:</span><strong className="text-foreground">{currency}</strong></div>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleFinish}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {isPending ? 'Saving…' : 'Enter the Suite'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
