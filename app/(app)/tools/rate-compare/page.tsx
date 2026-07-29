"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Scale, TrendingUp, TrendingDown, CheckCircle, Info } from 'lucide-react'

const BENCHMARKS: Record<string, { role: string; junior: number; mid: number; senior: number; top: number }> = {
  webdev: { role: 'Full-Stack Web Developer', junior: 35, mid: 65, senior: 110, top: 175 },
  frontend: { role: 'Frontend Engineer (React/Next)', junior: 30, mid: 60, senior: 95, top: 150 },
  design: { role: 'UI/UX & Product Designer', junior: 30, mid: 55, senior: 90, top: 140 },
  mobile: { role: 'Mobile App Developer (iOS/Flutter)', junior: 40, mid: 70, senior: 120, top: 180 },
  copywriting: { role: 'Copywriter & Content Strategist', junior: 25, mid: 45, senior: 75, top: 125 },
  consulting: { role: 'DevOps & Cloud Architect', junior: 45, mid: 85, senior: 140, top: 220 },
}

export default function RateComparisonPage() {
  const [roleKey, setRoleKey] = useState<string>('webdev')
  const [userRate, setUserRate] = useState<number>(75)

  const benchmark = BENCHMARKS[roleKey] || BENCHMARKS.webdev

  const getPercentileText = (rate: number) => {
    if (rate < benchmark.junior) return { label: 'Below Junior Average', color: 'text-amber-400', isLow: true }
    if (rate <= benchmark.mid) return { label: 'Junior-to-Mid Tier (25th - 50th percentile)', color: 'text-blue-400', isLow: false }
    if (rate <= benchmark.senior) return { label: 'Mid-to-Senior Tier (50th - 75th percentile)', color: 'text-green-400', isLow: false }
    return { label: 'Top Tier Specialist (90th+ percentile)', color: 'text-primary font-bold', isLow: false }
  }

  const percentile = getPercentileText(userRate)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
          <Scale className="w-4 h-4" /> Freelancer Tools
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Freelance Rate Comparison & Benchmarks</h1>
        <p className="text-sm text-muted-foreground">
          See how your hourly billing rate compares against industry standards by discipline and experience level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Controls */}
        <Card className="md:col-span-5 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Your Discipline & Rate</CardTitle>
            <CardDescription className="text-xs">Select your specialty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Specialty / Role</label>
              <Select value={roleKey} onValueChange={val => val && setRoleKey(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="webdev">Full-Stack Web Developer</SelectItem>
                  <SelectItem value="frontend">Frontend Engineer (React/Next)</SelectItem>
                  <SelectItem value="design">UI/UX & Product Designer</SelectItem>
                  <SelectItem value="mobile">Mobile App Developer</SelectItem>
                  <SelectItem value="copywriting">Copywriter & Strategist</SelectItem>
                  <SelectItem value="consulting">DevOps & Cloud Architect</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Your Current Hourly Rate ($)</label>
              <Input
                type="number"
                value={userRate}
                onChange={e => setUserRate(parseFloat(e.target.value) || 0)}
                step="5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Comparison Benchmark Visual */}
        <Card className="md:col-span-7 border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-semibold">{benchmark.role}</CardTitle>
            <CardDescription className="text-xs">Industry hourly rate distribution (USD)</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Status summary */}
            <div className="p-3.5 rounded-lg border border-border/40 bg-muted/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Your Position</div>
                <div className={`text-sm font-semibold mt-0.5 ${percentile.color}`}>
                  {percentile.label}
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-primary">${userRate}/hr</div>
            </div>

            {/* Visual tier bars */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Junior (0-2 yrs)</span>
                  <span className="font-mono">${benchmark.junior}/hr</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-blue-500/40 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Mid-Level (2-5 yrs)</span>
                  <span className="font-mono">${benchmark.mid}/hr</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500/50 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Senior Specialist (5-8+ yrs)</span>
                  <span className="font-mono">${benchmark.senior}/hr</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Top Consultant (Niche Expert)</span>
                  <span className="font-mono">${benchmark.top}+/hr</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-500/80 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
