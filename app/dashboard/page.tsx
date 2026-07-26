import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Clock, AlertCircle, FileText } from 'lucide-react'

export default async function DashboardPage() {
  // In a real scenario with a valid DB, we would fetch these from Supabase
  // using createClient() from utils/supabase/server.
  // For now, these are placeholder values to show the UI structure.
  
  const stats = {
    totalEarned: 12500,
    pendingAmount: 3200,
    overdueAmount: 850,
    overdueCount: 2,
    totalInvoices: 24,
  }

  const recentInvoices = [
    { id: '1', client: 'Acme Corp', amount: 1200, status: 'paid', date: '2026-07-20' },
    { id: '2', client: 'Globex Inc', amount: 850, status: 'overdue', date: '2026-07-15' },
    { id: '3', client: 'Soylent Corp', amount: 2350, status: 'unpaid', date: '2026-07-25' },
    { id: '4', client: 'Initech', amount: 450, status: 'paid', date: '2026-07-10' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Here is a summary of your freelance business.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Waiting on 5 invoices</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Overdue Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">${stats.overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">{stats.overdueCount} invoices require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Issued this year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your most recent invoices and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentInvoices.map(invoice => (
                <div key={invoice.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{invoice.client}</p>
                    <p className="text-sm text-muted-foreground">Issued on {invoice.date}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <Badge 
                      variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}
                      className="capitalize"
                    >
                      {invoice.status}
                    </Badge>
                    <div className="font-medium">${invoice.amount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Placeholder for the chart */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground bg-muted/20 rounded-md border-dashed border-2 m-4">
            Chart Component (Recharts)
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
