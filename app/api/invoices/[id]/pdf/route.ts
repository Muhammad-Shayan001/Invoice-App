import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { InvoicePDF } from '@/components/InvoicePDF'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: inv } = await supabase
      .from('invoices')
      .select('*, clients(name, email, address, phone), invoice_items(description, quantity, unit_price)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!inv) {
      return new NextResponse('Invoice not found', { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', user.id)
      .single()

    const businessName = profile?.business_name || 'Invoicer'

    const pdfElement = React.createElement(InvoicePDF, {
      inv: { ...inv, businessName },
    })

    const pdfBuffer = await renderToBuffer(pdfElement as any)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${inv.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return new NextResponse('Failed to generate PDF', { status: 500 })
  }
}
