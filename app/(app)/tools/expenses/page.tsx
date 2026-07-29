"use client"

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/toast'
import {
  Receipt,
  Plus,
  Trash2,
  Download,
  DollarSign,
  Tag,
  Calendar,
  Filter,
  Loader2,
} from 'lucide-react'
import type { Expense } from '@/types/database'
import { createExpenseAction, deleteExpenseAction } from './actions'
import { exportToCSV } from '@/lib/utils/csv'

const CATEGORIES = ['Software & Hosting', 'Hardware & Equipment', 'Marketing & Ads', 'Legal & Accounting', 'Office Supplies', 'General']

export default function ExpenseTrackerPage() {
  const toast = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // Form states
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Software & Hosting')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const loadData = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false })
    setExpenses(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('amount', amount)
      formData.append('category', category)
      formData.append('date', date)

      const res = await createExpenseAction(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Expense added!')
        setTitle('')
        setAmount('')
        loadData()
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteExpenseAction(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Expense deleted!')
        loadData()
      }
    })
  }

  const handleExportCSV = () => {
    if (expenses.length === 0) return
    exportToCSV('business_expenses', expenses, [
      { key: 'date', label: 'Date' },
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount ($)' },
    ])
    toast.success('Expenses exported to CSV!')
  }

  const filtered = expenses.filter(e => filterCategory === 'all' || e.category === filterCategory)
  const totalAmount = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <Receipt className="w-4 h-4" /> Freelancer Tools
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Log business expenses by category and export data for tax reporting.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={expenses.length === 0} className="gap-2 shrink-0">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <Card className="lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Log Business Expense</CardTitle>
            <CardDescription className="text-xs">Add a new receipt or business cost</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs">Expense Description</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Vercel Hosting & Domain"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="49.00"
                  required
                  min="0.01"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs">Category</Label>
                <Select value={category} onValueChange={val => val && setCategory(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={isPending} className="w-full gap-2">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Expenses List & Stats */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Expenses Logged</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary font-mono">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">{filtered.length} entries</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {expenses.length > 0 ? expenses[0].category : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Deductible for tax calculations</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">Expense Log</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <Select value={filterCategory} onValueChange={val => val && setFilterCategory(val)}>
                  <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-xs">
                  No expenses logged yet. Add your first expense on the left.
                </div>
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {filtered.map(item => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="text-muted-foreground text-[11px] flex items-center gap-2 mt-0.5">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{item.category}</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-foreground">${Number(item.amount).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
