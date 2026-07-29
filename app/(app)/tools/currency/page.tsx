"use client"

import { useState } from 'react'
import { CurrencyWidget } from '@/components/CurrencyWidget'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Globe, Clock, History, Check } from 'lucide-react'

export default function CurrencyConverterPage() {
  const [recentList, setRecentList] = useState<{ amount: number; from: string; to: string; result: number; time: string }[]>([
    { amount: 1000, from: 'USD', to: 'EUR', result: 920, time: 'Just now' },
    { amount: 500, from: 'GBP', to: 'USD', result: 633, time: '10 min ago' },
  ])

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
          <Globe className="w-4 h-4" /> Freelancer Tools
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Currency Converter</h1>
        <p className="text-sm text-muted-foreground">
          Convert freelance earnings between foreign client currencies and your preferred local currency in real time.
        </p>
      </div>

      {/* Main Widget */}
      <CurrencyWidget defaultAmount={1000} defaultFrom="USD" defaultTo="EUR" />

      {/* Feature Highlights / Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Live Rate Source
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Exchange rates are sourced live from central banks via European Central Bank data. Rates update hourly.
            </p>
            <div className="flex items-center gap-2 text-foreground font-medium pt-1">
              <Check className="w-3.5 h-3.5 text-green-500" /> Supports USD, EUR, GBP, CAD, AUD, INR, PKR, JPY & more.
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Integrated Across Suite
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              This live converter also powers the inline currency estimator on your invoice detail pages and dashboard widgets.
            </p>
            <div className="flex items-center gap-2 text-foreground font-medium pt-1">
              <Check className="w-3.5 h-3.5 text-green-500" /> Auto-converts foreign invoice amounts for quick reference.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
