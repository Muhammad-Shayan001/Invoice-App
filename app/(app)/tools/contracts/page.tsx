"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileSpreadsheet, Printer, AlertTriangle, ShieldCheck } from 'lucide-react'

const TEMPLATES: Record<string, { title: string; defaultScope: string; terms: string }> = {
  webdev: {
    title: 'Independent Web Development Agreement',
    defaultScope: 'Development of custom web application using React/Next.js, responsive layouts, API integration, testing, and deployment to hosting server.',
    terms: '50% upfront deposit before work commences, 50% upon final launch delivery. Client provides design assets & copy.',
  },
  design: {
    title: 'Freelance Design & Branding Agreement',
    defaultScope: 'Creation of visual brand identity, logo suite, brand guidelines document, component library, and exportable design assets in SVG/Figma.',
    terms: 'Up to 3 revisions included. Additional revisions billed at hourly rate. Source files delivered upon full payment.',
  },
  consulting: {
    title: 'Professional Consulting & Advisory Agreement',
    defaultScope: 'Strategic software architecture review, code audits, team mentoring, and technical advisory sessions as agreed per week.',
    terms: 'Invoiced bi-weekly. Payment due within 14 days of invoice issue date. Confidentiality NDA applies.',
  },
}

export default function ContractGeneratorPage() {
  const [templateKey, setTemplateKey] = useState<string>('webdev')
  const [contractorName, setContractorName] = useState('Your Business / Name')
  const [clientName, setClientName] = useState('Client Business / Name')
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])
  const [projectRate, setProjectRate] = useState('$5,000 USD Fixed Fee')
  const [customScope, setCustomScope] = useState(TEMPLATES.webdev.defaultScope)
  const [customTerms, setCustomTerms] = useState(TEMPLATES.webdev.terms)

  const handleTemplateChange = (val: string) => {
    setTemplateKey(val)
    if (TEMPLATES[val]) {
      setCustomScope(TEMPLATES[val].defaultScope)
      setCustomTerms(TEMPLATES[val].terms)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <FileSpreadsheet className="w-4 h-4" /> Freelancer Tools
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Contract & Agreement Generator</h1>
          <p className="text-sm text-muted-foreground">
            Generate clean, professional freelance service contracts for your web, design, or consulting projects.
          </p>
        </div>
        <Button onClick={() => window.print()} className="gap-2 shrink-0">
          <Printer className="w-4 h-4" /> Print / Save Contract
        </Button>
      </div>

      {/* Disclaimer Alert */}
      <div className="flex items-center gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 print:hidden">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>
          <strong>Disclaimer:</strong> This generator provides standard contract templates for freelance demonstration purposes and does not constitute formal legal advice.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-5 border-border/50 shadow-sm print:hidden">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Contract Parameters</CardTitle>
            <CardDescription className="text-xs">Customize parties, scope, and payment terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Select Template Type</Label>
              <Select value={templateKey} onValueChange={val => val && handleTemplateChange(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="webdev">Web Development Agreement</SelectItem>
                  <SelectItem value="design">Design & Branding Agreement</SelectItem>
                  <SelectItem value="consulting">Consulting & Advisory Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Contractor (Your Name / Business)</Label>
              <Input value={contractorName} onChange={e => setContractorName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Client (Client Name / Business)</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Effective Date</Label>
                <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Compensation / Rate</Label>
                <Input value={projectRate} onChange={e => setProjectRate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Scope of Services</Label>
              <Textarea
                value={customScope}
                onChange={e => setCustomScope(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Payment & Delivery Terms</Label>
              <Textarea
                value={customTerms}
                onChange={e => setCustomTerms(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contract Preview Document */}
        <Card className="lg:col-span-7 border-border/60 shadow-lg bg-card print:col-span-12 print:shadow-none print:border-none">
          <CardContent className="p-8 space-y-6 text-xs text-foreground leading-relaxed">
            {/* Header */}
            <div className="text-center border-b border-border/50 pb-6 space-y-1">
              <h2 className="text-lg font-bold uppercase tracking-wider text-primary">
                {TEMPLATES[templateKey]?.title || 'Independent Service Agreement'}
              </h2>
              <p className="text-muted-foreground">Effective Date: {effectiveDate}</p>
            </div>

            {/* Parties */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">1. Parties & Purpose</h3>
              <p className="text-muted-foreground">
                This Agreement is entered into by and between <strong className="text-foreground">{contractorName}</strong> (&quot;Contractor&quot;) and{' '}
                <strong className="text-foreground">{clientName}</strong> (&quot;Client&quot;). Contractor agrees to perform services for Client in accordance with the terms herein.
              </p>
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">2. Services & Scope</h3>
              <p className="text-muted-foreground p-3 rounded-lg border border-border/40 bg-muted/20 whitespace-pre-wrap">
                {customScope}
              </p>
            </div>

            {/* Compensation */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">3. Compensation & Payment Terms</h3>
              <p className="text-muted-foreground">
                Client shall pay Contractor <strong className="text-foreground font-mono">{projectRate}</strong>.
              </p>
              <p className="text-muted-foreground whitespace-pre-wrap p-3 rounded-lg border border-border/40 bg-muted/20">
                {customTerms}
              </p>
            </div>

            {/* Intellectual Property */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">4. Intellectual Property & Ownership</h3>
              <p className="text-muted-foreground">
                Upon full and final payment of all outstanding invoices, Contractor assigns to Client all right, title, and interest in deliverables created specifically under this Agreement. Contractor retains the right to showcase completed non-confidential work in their professional portfolio.
              </p>
            </div>

            {/* Signatures */}
            <div className="border-t border-border/50 pt-8 mt-8 space-y-6">
              <p className="font-semibold text-muted-foreground text-[11px]">
                IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the Effective Date written above.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-8">
                  <div className="border-b border-border/60 pb-1 font-semibold">{contractorName}</div>
                  <div className="text-[11px] text-muted-foreground">Contractor Signature & Date</div>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-border/60 pb-1 font-semibold">{clientName}</div>
                  <div className="text-[11px] text-muted-foreground">Client Signature & Date</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
