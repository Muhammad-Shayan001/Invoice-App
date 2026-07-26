export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          client_id: string
          invoice_number: string
          issue_date?: string
          due_date: string
          status?: 'paid' | 'unpaid' | 'overdue'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          invoice_number?: string
          issue_date?: string
          due_date?: string
          status?: 'paid' | 'unpaid' | 'overdue'
          notes?: string | null
          created_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
        }
      }
    }
    Views: {
      invoice_totals: {
        Row: {
          invoice_id: string
          total_amount: number
        }
      }
    }
    Functions: {
      update_overdue_invoices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
