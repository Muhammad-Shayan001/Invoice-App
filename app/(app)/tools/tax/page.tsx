"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Percent, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'

export default function TaxEstimatorPage() {
  const [annualRevenue, setAnnualRevenue] = useState<number>(95000)
  const [businessExpenses, setBusinessExpenses] = useState<number>(8000)
  const [taxBracket, setTaxBracket] = useState<string>('25')

  const netIncome = Math.max(0, annualRevenue - businessExpenses)
  const ratePercent = parseFloat(taxBracket) || 25
  const estimatedTax = (netIncome * ratePercent) / 100
  const monthlySetAside = estimatedTax / 12
  const quarterlyEstimatedPayment = estimatedTax / 4
  const netTakeHome = netIncome - estimatedTax

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
          <Percent className="w-4 h-4" /> Freelancer Tools
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Tax & Income Set-Aside Estimator</h1>
        <p className="text-sm text-muted-foreground">
          Know exactly how much money to set aside each month for estimated quarterly tax payments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Card */}
        <Card className="md:col-span-6 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Income & Expense Inputs</CardTitle>
            <CardDescription className="text-xs">Enter your estimated annual numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Gross Annual Revenue ($)</Label>
              <Input
                type="number"
                value={annualRevenue}
                onChange={e => setAnnualRevenue(parseFloat(e.target.value) || 0)}
                step="5000"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Deductible Business Expenses ($)</Label>
              <Input
                type="number"
                value={businessExpenses}
                onChange={e => setBusinessExpenses(parseFloat(e.target.value) || 0)}
                step="500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Combined Effective Tax Rate (%)</Label>
              <Select value={taxBracket} onValueChange={val => val && setTaxBracket(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15% (Low Bracket / Minimal State Tax)</SelectItem>
                  <SelectItem value="25">25% (Standard US/EU Freelance Average)</SelectItem>
                  <SelectItem value="30">30% (Moderate Bracket + Self-Employment Tax)</SelectItem>
                  <SelectItem value="35">35% (High Income / Higher Tax Region)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Includes federal, state/local & self-employment taxes.</p>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="md:col-span-6 border-primary/40 bg-gradient-to-b from-primary/10 via-background to-background shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recommended Monthly Tax Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="text-3xl font-extrabold text-primary font-mono tracking-tight">
                ${Math.round(monthlySetAside).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ month</span>
              </div>
              <div className="text-xs font-medium text-foreground mt-1">
                Or ${Math.round(quarterlyEstimatedPayment).toLocaleString()} per quarterly payment
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border/50 bg-card text-xs space-y-2">
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Gross Revenue:</span>
                <span className="font-mono font-semibold">${annualRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Minus Expenses:</span>
                <span className="font-mono font-semibold text-amber-500">-${businessExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Net Taxable Profit:</span>
                <span className="font-mono font-semibold">${netIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Est. Total Tax ({taxBracket}%):</span>
                <span className="font-mono font-bold text-destructive">${Math.round(estimatedTax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-sm text-foreground">
                <span>Net Take-Home Pay:</span>
                <span className="font-mono text-green-500">${Math.round(netTakeHome).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
