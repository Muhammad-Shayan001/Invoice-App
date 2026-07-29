import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import nodemailer from 'nodemailer'
import React from 'react'
import { InvoicePDF, Item } from '@/components/InvoicePDF'

export const dynamic = 'force-dynamic'

function formatCurrencyEmail(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDateEmail(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: inv } = await supabase
      .from('invoices')
      .select('*, clients(name, email, address, phone), invoice_items(description, quantity, unit_price)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!inv) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!inv.clients?.email) {
      return NextResponse.json({ error: 'Client does not have an email address' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', user.id)
      .single()

    const businessName = profile?.business_name || 'Invoicer'
    const total = inv.invoice_items.reduce((s: number, i: Item) => s + i.quantity * i.unit_price, 0)

    const pdfElement = React.createElement(InvoicePDF, {
      inv: { ...inv, businessName },
    })

    const pdfBuffer = await renderToBuffer(pdfElement as any)

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    })

    const fromEmail = process.env.FROM_EMAIL || 'noreply@invoicer.app'

    await transporter.sendMail({
      from: `"${businessName}" <${fromEmail}>`,
      to: inv.clients.email,
      subject: `Invoice ${inv.invoice_number} from ${businessName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Invoice ${inv.invoice_number}</h2>
          <p>Hi ${inv.clients.name},</p>
          <p>Please find attached your invoice <strong>${inv.invoice_number}</strong> for <strong>${formatCurrencyEmail(total)}</strong>.</p>
          <p><strong>Due Date:</strong> ${formatDateEmail(inv.due_date)}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Thank you,<br/>${businessName}</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${inv.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    return NextResponse.json({ success: true, message: `Invoice sent to ${inv.clients.email}` })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to send email' }, { status: 500 })
  }
}
