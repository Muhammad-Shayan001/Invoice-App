export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
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
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
}

export interface Profile {
  id: string
  full_name: string | null
  business_name: string | null
  logo_url: string | null
  created_at: string
}

// Extended types with joins
export interface InvoiceWithDetails extends Omit<Invoice, 'status'> {
  status: 'paid' | 'unpaid' | 'overdue'
  clients: Pick<Client, 'id' | 'name' | 'email' | 'address' | 'phone'>
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
