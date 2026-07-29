import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

function formatCurrencyPDF(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDatePDF(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 52,
    paddingRight: 52,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
  },
  brandSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceLabel: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 2,
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
    marginTop: 4,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  colDesc: { flex: 1 },
  colQty: { width: 48, textAlign: 'right' },
  colRate: { width: 72, textAlign: 'right' },
  colAmount: { width: 80, textAlign: 'right' },
  tableText: { fontSize: 10, color: '#334155' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    marginRight: 24,
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
  },
  notes: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4f46e5',
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 52,
    right: 52,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
  },
})

export interface Item {
  description: string
  quantity: number
  unit_price: number
}

export interface Client {
  name: string
  email: string | null
  address: string | null
  phone: string | null
}

export interface InvoicePDFData {
  invoice_number: string
  issue_date: string
  due_date: string
  status: string
  notes: string | null
  clients: Client
  invoice_items: Item[]
  businessName: string
}

export function InvoicePDF({ inv }: { inv: InvoicePDFData }) {
  const total = inv.invoice_items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  return (
    <Document title={`Invoice ${inv.invoice_number}`} author={inv.businessName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{inv.businessName}</Text>
            <Text style={styles.brandSub}>Freelance Business Invoice</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{inv.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{formatDatePDF(inv.issue_date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{formatDatePDF(inv.due_date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{inv.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Billed To</Text>
          <Text style={styles.clientName}>{inv.clients.name}</Text>
          {inv.clients.email && <Text style={styles.clientDetail}>{inv.clients.email}</Text>}
          {inv.clients.phone && <Text style={styles.clientDetail}>{inv.clients.phone}</Text>}
          {inv.clients.address && <Text style={styles.clientDetail}>{inv.clients.address}</Text>}
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
        </View>

        {inv.invoice_items.map((item, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableText, styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.tableText, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.tableText, styles.colRate]}>{formatCurrencyPDF(item.unit_price)}</Text>
            <Text style={[styles.tableText, styles.colAmount]}>{formatCurrencyPDF(item.quantity * item.unit_price)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL DUE</Text>
          <Text style={styles.totalAmount}>{formatCurrencyPDF(total)}</Text>
        </View>

        {inv.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes & Terms</Text>
            <Text style={styles.notesText}>{inv.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>Thank you for your business! • {inv.businessName}</Text>
      </Page>
    </Document>
  )
}
