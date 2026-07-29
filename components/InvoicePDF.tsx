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
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 56,
    paddingRight: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
  },
  invoiceLabel: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a2e',
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 11,
    color: '#1a1a2e',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  colDesc: { flex: 1 },
  colQty: { width: 48, textAlign: 'right' },
  colRate: { width: 72, textAlign: 'right' },
  colAmount: { width: 80, textAlign: 'right' },
  tableText: { fontSize: 10, color: '#374151' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    marginRight: 24,
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
  },
  notes: {
    marginTop: 28,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 56,
    right: 56,
    textAlign: 'center',
    fontSize: 9,
    color: '#d1d5db',
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
          <Text style={styles.brandName}>{inv.businessName}</Text>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{inv.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.divider} />

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
          <Text style={styles.sectionLabel}>Bill To</Text>
          <Text style={styles.clientName}>{inv.clients.name}</Text>
          {inv.clients.email && <Text style={styles.clientDetail}>{inv.clients.email}</Text>}
          {inv.clients.phone && <Text style={styles.clientDetail}>{inv.clients.phone}</Text>}
          {inv.clients.address && <Text style={styles.clientDetail}>{inv.clients.address}</Text>}
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
        </View>

        {inv.invoice_items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
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
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{inv.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>Thank you for your business!</Text>
      </Page>
    </Document>
  )
}
