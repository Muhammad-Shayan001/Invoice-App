"use client"

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/toast'
import {
  Calculator,
  DollarSign,
  Calendar,
  Clock,
  Receipt,
  Percent,
  CheckCircle,
  Sparkles,
  History,
  Loader2,
  HelpCircle,
} from 'lucide-react'
import { calculateHourlyRate, type RateCalcResult } from '@/lib/rate-calc'
import { saveDefaultRateAction } from './actions'
import type { RateCalculation } from '@/types/database'

export default function HourlyRateCalculatorPage() {
  const toast = useToast()
  const [income, setIncome] = useState<number>(80000)
  const [days, setDays] = useState<number>(220)
  const [hours, setHours] = useState<number>(5)
  const [expenses, setExpenses] = useState<number>(5000)
  const [taxRate, setTaxRate] = useState<number>(25)

  const [history, setHistory] = useState<RateCalculation[]>([])
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Calculate live
  const result: RateCalcResult = calculateHourlyRate({
    desiredYearlyIncome: income,
    workingDaysPerYear: days,
    billableHoursPerDay: hours,
    businessExpenses: expenses,
    taxRatePercent: taxRate,
  })

  // Load history & profile default
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: historyData } = await supabase
        .from('rate_calculations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (historyData) setHistory(historyData)
    }
    load()
  }, [])

  const handleSaveRate = () => {
    startTransition(async () => {
      setSaving(true)
      const res = await saveDefaultRateAction(result.hourlyRate, {
        desired_yearly_income: income,
        working_days_per_year: days,
        billable_hours_per_day: hours,
        business_expenses: expenses,
        tax_rate_percent: taxRate,
      })
      setSaving(false)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Saved $${result.hourlyRate}/hr as your suite default rate!`)
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 4000)
      }
    })
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
          <Calculator className="w-4 h-4" /> Freelancer Tools
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Hourly Rate Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Determine exactly what you should charge per hour to hit your income targets after expenses and taxes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-7 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Your Financial Inputs</CardTitle>
            <CardDescription className="text-xs">Adjust the numbers below to see instant calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Desired Income */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="income" className="text-xs font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary" /> Target Take-Home Income / Year
                </Label>
                <span className="text-xs font-mono font-bold text-primary">${income.toLocaleString()}</span>
              </div>
              <Input
                id="income"
                type="number"
                value={income}
                onChange={e => setIncome(parseFloat(e.target.value) || 0)}
                step="5000"
                min="0"
              />
            </div>

            {/* Working Days & Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days" className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Working Days / Year
                </Label>
                <Input
                  id="days"
                  type="number"
                  value={days}
                  onChange={e => setDays(parseInt(e.target.value) || 0)}
                  min="1"
                  max="365"
                />
                <p className="text-[11px] text-muted-foreground">Standard year: ~220 days (minus weekends & holidays)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours" className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Billable Hours / Day
                </Label>
                <Input
                  id="hours"
                  type="number"
                  value={hours}
                  onChange={e => setHours(parseFloat(e.target.value) || 0)}
                  step="0.5"
                  min="0.5"
                  max="12"
                />
                <p className="text-[11px] text-muted-foreground">Realistic billable time (not total 8h workday)</p>
              </div>
            </div>

            {/* Expenses & Taxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div className="space-y-2">
                <Label htmlFor="expenses" className="text-xs font-semibold flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-primary" /> Annual Business Expenses ($)
                </Label>
                <Input
                  id="expenses"
                  type="number"
                  value={expenses}
                  onChange={e => setExpenses(parseFloat(e.target.value) || 0)}
                  step="500"
                  min="0"
                />
                <p className="text-[11px] text-muted-foreground">Software, equipment, hosting, health insurance</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate" className="text-xs font-semibold flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-primary" /> Estimated Tax Rate (%)
                </Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={taxRate}
                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                  step="1"
                  min="0"
                  max="80"
                />
                <p className="text-[11px] text-muted-foreground">Income + self-employment tax set-aside</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-primary/40 bg-gradient-to-b from-primary/10 via-background to-background shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recommended Minimum Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="text-4xl font-extrabold text-primary font-mono tracking-tight">
                  ${result.hourlyRate.toFixed(2)} <span className="text-base font-normal text-muted-foreground">/ hr</span>
                </div>
                <div className="text-sm font-semibold text-foreground mt-1">
                  Or ${result.dayRate.toFixed(2)} / day
                </div>
              </div>

              {/* Math breakdown */}
              <div className="p-3.5 rounded-lg border border-border/50 bg-muted/40 text-xs space-y-2">
                <div className="font-semibold text-foreground border-b border-border/50 pb-1.5">
                  Why this rate?
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To take home <strong className="text-foreground">${result.breakdown.income.toLocaleString()}</strong> after paying{' '}
                  <strong className="text-foreground">${result.breakdown.expenses.toLocaleString()}</strong> in expenses and reserving{' '}
                  <strong className="text-foreground">${result.breakdown.taxAmount.toLocaleString()}</strong> for taxes ({taxRate}%), your business must generate{' '}
                  <strong className="text-foreground">${result.breakdown.totalRevenueNeeded.toLocaleString()}</strong> total revenue across{' '}
                  <strong className="text-foreground">{result.breakdown.yearlyHours} billable hours</strong>/year.
                </p>
              </div>

              {/* Save as default rate action */}
              <Button
                onClick={handleSaveRate}
                disabled={saving || isPending}
                className="w-full gap-2 shadow"
                size="lg"
              >
                {saving || isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" /> Saved as Default Rate!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Save as My Default Rate
                  </>
                )}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Saving updates your global default rate used by the Time Tracker & Invoice Generator.
              </p>
            </CardContent>
          </Card>

          {/* Past History */}
          {history.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Recent Saved Calculations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40 text-xs">
                  {history.map(item => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">${item.result_hourly_rate}/hr target</div>
                        <div className="text-muted-foreground text-[11px]">
                          ${item.desired_yearly_income?.toLocaleString()}/yr target • {item.tax_rate_percent}% tax
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
