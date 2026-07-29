"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Globe, Loader2, RefreshCw } from 'lucide-react'
import { convertCurrency, COMMON_CURRENCIES, type ConversionResult } from '@/lib/currency'

interface CurrencyWidgetProps {
  compact?: boolean
  defaultAmount?: number
  defaultFrom?: string
  defaultTo?: string
  title?: string
}

export function CurrencyWidget({
  compact = false,
  defaultAmount = 100,
  defaultFrom = 'USD',
  defaultTo = 'EUR',
  title = 'Currency Converter',
}: CurrencyWidgetProps) {
  const [amount, setAmount] = useState<number>(defaultAmount)
  const [from, setFrom] = useState<string>(defaultFrom)
  const [to, setTo] = useState<string>(defaultTo)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [loading, setLoading] = useState(false)

  const doConvert = async () => {
    setLoading(true)
    try {
      const res = await convertCurrency(amount, from, to)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    doConvert()
  }, [amount, from, to])

  const handleSwap = () => {
    const temp = from
    setFrom(to)
    setTo(temp)
  }

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 text-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Globe className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-xs text-muted-foreground whitespace-nowrap">Live Exchange:</span>
        </div>

        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            className="h-8 w-24 text-xs font-mono"
          />
          <Select value={from} onValueChange={val => val && setFrom(val)}>
            <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMMON_CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon-sm" onClick={handleSwap} className="h-8 w-8">
            <ArrowUpDown className="w-3.5 h-3.5 rotate-90" />
          </Button>

          <Select value={to} onValueChange={val => val && setTo(val)}>
            <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMMON_CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 font-semibold text-primary font-mono text-sm whitespace-nowrap">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : result ? (
            <span>≈ {result.convertedAmount.toLocaleString()} {result.to}</span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
          {result && (
            <span className="text-[11px] text-muted-foreground font-mono">
              1 {result.from} = {result.rate} {result.to}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              className="font-mono text-base"
              min="0"
              step="any"
            />
          </div>

          <div className="sm:col-span-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Select value={from} onValueChange={val => val && setFrom(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMON_CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-1 flex justify-center pb-1">
            <Button variant="outline" size="icon" onClick={handleSwap} title="Swap currencies">
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="sm:col-span-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Select value={to} onValueChange={val => val && setTo(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMON_CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Converted Result Display */}
        <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Converted Value</div>
            <div className="text-3xl font-bold text-primary font-mono mt-1">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : result ? (
                `${result.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${result.to}`
              ) : (
                '0.00'
              )}
            </div>
          </div>

          {result && (
            <div className="text-right text-xs text-muted-foreground font-mono space-y-0.5">
              <div>Rate: 1 {result.from} = {result.rate} {result.to}</div>
              <div>Updated: {result.timestamp} ({result.date})</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
