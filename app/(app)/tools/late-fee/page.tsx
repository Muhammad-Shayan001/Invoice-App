"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Copy, DollarSign, Check } from 'lucide-react'
import { useToast } from '@/components/toast'

export default function LateFeeCalculatorPage() {
  const toast = useToast()
  const [invoiceAmount, setInvoiceAmount] = useState<number>(2500)
  const [daysOverdue, setDaysOverdue] = useState<number>(15)
  const [lateFeePercent, setLateFeePercent] = useState<number>(5) // 5% monthly or flat
  const [feeType, setFeeType] = useState<'flat' | 'monthly'>('monthly')

  let lateFeeAmount = 0
  if (feeType === 'flat') {
    lateFeeAmount = (invoiceAmount * lateFeePercent) / 100
  } else {
    // Pro-rated monthly interest: (amount * rate * (days / 30))
    lateFeeAmount = invoiceAmount * (lateFeePercent / 100) * (daysOverdue / 30)
  }

  const totalOwed = invoiceAmount + lateFeeAmount

  const reminderText = `Hi there,\n\nThis is a friendly reminder regarding Invoice for $${invoiceAmount.toLocaleString()}, which is now ${daysOverdue} days past due.\n\nPer our contract terms, a late fee of $${lateFeeAmount.toFixed(2)} (${lateFeePercent}% ${feeType === 'flat' ? 'flat fee' : 'monthly interest'}) has been applied.\n\nThe revised total now due is $${totalOwed.toFixed(2)} USD.\n\nPlease confirm payment status at your earliest convenience.\n\nThank you!`

  const handleCopyText = () => {
    navigator.clipboard.writeText(reminderText)
    toast.success('Payment reminder message copied to clipboard!')
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
          <AlertTriangle className="w-4 h-4" /> Freelancer Tools
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Late Fee & Reminder Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Calculate late interest for overdue invoices and copy pre-formatted payment reminder emails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Card */}
        <Card className="md:col-span-6 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Late Fee Calculation</CardTitle>
            <CardDescription className="text-xs">Enter original invoice & overdue details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Original Invoice Amount ($)</Label>
              <Input
                type="number"
                value={invoiceAmount}
                onChange={e => setInvoiceAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Days Overdue</Label>
              <Input
                type="number"
                value={daysOverdue}
                onChange={e => setDaysOverdue(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Late Fee Rate (%)</Label>
                <Input
                  type="number"
                  value={lateFeePercent}
                  onChange={e => setLateFeePercent(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fee Structure</Label>
                <select
                  value={feeType}
                  onChange={e => setFeeType(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="monthly">Monthly Interest (Pro-rated)</option>
                  <option value="flat">Flat Percentage Fee</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Result & Copyable Message */}
        <div className="md:col-span-6 space-y-6">
          <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-destructive uppercase tracking-wider">
                Revised Total Now Owed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-extrabold text-destructive font-mono">
                ${totalOwed.toFixed(2)} USD
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Original Invoice:</span>
                  <span className="font-mono font-semibold">${invoiceAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Late Fee Applied ({daysOverdue} days):</span>
                  <span className="font-mono font-semibold">+${lateFeeAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copy Reminder Email */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Client Payment Reminder Template
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={handleCopyText} className="h-7 text-xs gap-1.5 text-primary">
                <Copy className="w-3.5 h-3.5" /> Copy Email
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="p-3 rounded-lg border border-border/40 bg-muted/40 text-xs font-sans whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {reminderText}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
