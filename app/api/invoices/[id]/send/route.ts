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
      .select('business_name, full_name')
      .eq('id', user.id)
      .single()

    const businessName = profile?.business_name || profile?.full_name || 'Invoicer'
    const total = (inv.invoice_items || []).reduce((s: number, i: Item) => s + i.quantity * i.unit_price, 0)

    // Render PDF Buffer
    const pdfElement = React.createElement(InvoicePDF, {
      inv: { ...inv, businessName },
    })

    const pdfBuffer = await renderToBuffer(pdfElement as any)

    // Determine SMTP configuration (fallback to configured Gmail if env is missing)
    let smtpUser = process.env.SMTP_USER || ''
    let smtpPass = process.env.SMTP_PASS || ''
    let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    let smtpPort = Number(process.env.SMTP_PORT) || 587

    // Fallback to active Gmail account if env is unconfigured or placeholder
    if (!smtpUser || smtpUser === 'your-smtp-user' || smtpUser === 'your-gmail@gmail.com') {
      smtpUser = 'muhammadshayan09277@gmail.com'
    }
    if (!smtpPass || smtpPass === 'your-smtp-password') {
      smtpPass = 'rbgg ahrb kacw pgvb'
    }

    // Clean whitespace from app password
    smtpPass = smtpPass.replace(/\s+/g, '')

    const fromEmail = process.env.FROM_EMAIL && !process.env.FROM_EMAIL.includes('noreply@invoicing.app')
      ? process.env.FROM_EMAIL
      : smtpUser

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort === 587,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    const itemsHtml = (inv.invoice_items || []).map((item: Item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrencyEmail(item.unit_price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatCurrencyEmail(item.quantity * item.unit_price)}</td>
      </tr>
    `).join('')

    await transporter.sendMail({
      from: `"${businessName}" <${fromEmail}>`,
      to: inv.clients.email,
      subject: `Invoice ${inv.invoice_number} from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">${businessName}</h1>
            <span style="background-color: #eef2ff; color: #4f46e5; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px;">INVOICE</span>
          </div>

          <p style="font-size: 16px; margin-bottom: 16px;">Hello <strong>${inv.clients.name}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 24px;">
            Here is your invoice <strong>${inv.invoice_number}</strong> issued by <strong>${businessName}</strong>. 
            A PDF copy is attached to this email for your records.
          </p>

          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #6b7280;">Invoice Number:</td>
                <td style="text-align: right; font-weight: bold;">${inv.invoice_number}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Issue Date:</td>
                <td style="text-align: right;">${formatDateEmail(inv.issue_date)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Due Date:</td>
                <td style="text-align: right; font-weight: bold; color: #dc2626;">${formatDateEmail(inv.due_date)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Total Amount:</td>
                <td style="text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${formatCurrencyEmail(total)}</td>
              </tr>
            </table>
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 12px;">Summary of Services</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Rate</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${inv.notes ? `
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Notes:</strong> ${inv.notes}</p>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #4b5563; margin-bottom: 24px;">If you have any questions regarding this invoice, please feel free to reach out directly.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            Sent securely via Invoicer • ${businessName}
          </p>
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

    return NextResponse.json({ success: true, message: `Invoice sent directly to ${inv.clients.email}` })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to send email' }, { status: 500 })
  }
}
