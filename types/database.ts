export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  hourly_rate?: number | null
  currency?: string | null
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  issue_date: string
  due_date: string
  status: 'paid' | 'unpaid' | 'overdue'
  notes: string | null
  currency?: string
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  source_time_entry_ids?: string[] | null
}

export interface Profile {
  id: string
  full_name: string | null
  business_name: string | null
  logo_url: string | null
  default_currency?: string
  default_hourly_rate?: number | null
  created_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  client_id: string | null
  description: string | null
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  billed: boolean
  created_at: string
  clients?: Pick<Client, 'id' | 'name' | 'hourly_rate' | 'currency'> | null
}

export interface RateCalculation {
  id: string
  user_id: string
  desired_yearly_income: number
  working_days_per_year: number
  billable_hours_per_day: number
  business_expenses: number
  tax_rate_percent: number
  result_hourly_rate: number
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  title: string
  amount: number
  category: string
  date: string
  notes: string | null
  created_at: string
}

// Extended types with joins
export interface InvoiceWithDetails extends Omit<Invoice, 'status'> {
  status: 'paid' | 'unpaid' | 'overdue'
  clients: Pick<Client, 'id' | 'name' | 'email' | 'address' | 'phone' | 'hourly_rate' | 'currency'>
  invoice_items: InvoiceItem[]
  total: number
}

export interface ClientWithStats extends Client {
  invoice_count: number
  total_billed: number
}

export interface DashboardStats {
  totalEarned: number
  pendingAmount: number
  overdueCount: number
  totalClients: number
  unbilledHours?: number
  defaultHourlyRate?: number
}

export interface MonthlyEarning {
  month: string
  label: string
  earnings: number
}

export interface ActionResult {
  success?: boolean
  error?: string
  data?: unknown
}
