"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileCheck, Plus, Trash2, Download, Printer, Sparkles } from 'lucide-react'

interface ScopeItem {
  id: string
  title: string
  description: string
  price: number
}

export default function ProposalGeneratorPage() {
  const [clientName, setClientName] = useState('Acme Corp')
  const [clientEmail, setClientEmail] = useState('contact@acme.com')
  const [projectTitle, setProjectTitle] = useState('Brand Redesign & E-Commerce Web App')
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  )
  const [items, setItems] = useState<ScopeItem[]>([
    { id: '1', title: 'UX Research & Wireframing', description: 'User flows, wireframes & clickable prototypes', price: 1500 },
    { id: '2', title: 'Frontend & Backend Development', description: 'Next.js application build with database integration', price: 4000 },
  ])

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), title: 'Additional Feature / Phase', description: '', price: 500 },
    ])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, field: keyof ScopeItem, val: any) => {
    setItems(items.map(i => (i.id === id ? { ...i, [field]: val } : i)))
  }

  const total = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <FileCheck className="w-4 h-4" /> Freelancer Tools
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Proposal & Quote Generator</h1>
          <p className="text-sm text-muted-foreground">
            Create professional client proposals and project scope quotes ready to print or save.
          </p>
        </div>
        <Button onClick={() => window.print()} className="gap-2 shrink-0">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form */}
        <Card className="lg:col-span-6 border-border/50 shadow-sm print:hidden">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Proposal Details</CardTitle>
            <CardDescription className="text-xs">Fill in project scope and pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Client Name</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Client Email</Label>
                <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Project Title</Label>
              <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Proposal Valid Until</Label>
              <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>

            {/* Items */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scope Deliverables</Label>
                <Button variant="ghost" size="sm" onClick={addItem} className="h-7 text-xs gap-1 text-primary">
                  <Plus className="w-3.5 h-3.5" /> Add Deliverable
                </Button>
              </div>

              {items.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.title}
                      onChange={e => updateItem(item.id, 'title', e.target.value)}
                      placeholder="Deliverable title"
                      className="font-medium text-xs"
                    />
                    <Input
                      type="number"
                      value={item.price}
                      onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="w-24 text-xs font-mono text-right"
                    />
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Deliverable details / acceptance criteria"
                    className="text-xs min-h-[60px]"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Preview Document */}
        <Card className="lg:col-span-6 border-border/60 shadow-lg bg-card print:col-span-12 print:shadow-none print:border-none">
          <CardContent className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-border/50 pb-6">
              <div>
                <span className="text-xs font-bold tracking-widest text-primary uppercase">PROJECT PROPOSAL</span>
                <h2 className="text-xl font-bold mt-1 text-foreground">{projectTitle}</h2>
                <p className="text-xs text-muted-foreground mt-1">Prepared for: <strong className="text-foreground">{clientName}</strong> ({clientEmail})</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">Invoicer Suite</div>
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>Valid Until: {validUntil}</div>
              </div>
            </div>

            {/* Deliverables List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scope of Work & Investment</h3>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-lg border border-border/40 bg-muted/20 flex justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm text-foreground">{idx + 1}. {item.title}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                    <div className="font-mono font-bold text-sm text-foreground shrink-0">
                      ${(item.price || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-border/50 pt-4 flex justify-between items-center">
              <div>
                <div className="text-xs text-muted-foreground">Estimated Total Investment</div>
                <div className="text-xs text-muted-foreground">Terms: 50% deposit upon acceptance</div>
              </div>
              <div className="text-2xl font-extrabold text-primary font-mono">
                ${total.toLocaleString()} USD
              </div>
            </div>

            {/* Acceptance Footer */}
            <div className="border-t border-border/40 pt-6 mt-8 space-y-4">
              <p className="text-[11px] text-muted-foreground italic">
                To accept this proposal, please sign below or confirm via email. Upon receipt, an initial deposit invoice will be issued to begin work.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="border-b border-border/60 pb-1 text-xs text-muted-foreground">Client Signature & Date</div>
                <div className="border-b border-border/60 pb-1 text-xs text-muted-foreground">Freelancer Signature & Date</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
