"use client"

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QrCode, Download, Copy, Check, ExternalLink } from 'lucide-react'
import { useToast } from '@/components/toast'

export default function QrGeneratorPage() {
  const toast = useToast()
  const [payType, setPayType] = useState<'url' | 'paypal' | 'bank'>('url')
  const [paymentUrl, setPaymentUrl] = useState('https://stripe.com/pay/invoicer-demo')
  const [paypalEmail, setPaypalEmail] = useState('freelancer@example.com')
  const [bankIban, setBankIban] = useState('US1234567890123456789')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const getTargetText = () => {
    if (payType === 'url') return paymentUrl
    if (payType === 'paypal') return `https://paypal.me/${paypalEmail.replace('@', '')}`
    return `Bank Wire Details:\nIBAN: ${bankIban}`
  }

  const generateQR = async () => {
    const text = getTargetText()
    if (!text) return
    try {
      const url = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#4f46e5', // primary indigo
          light: '#ffffff',
        },
      })
      setQrDataUrl(url)
    } catch {
      // Ignore error
    }
  }

  useEffect(() => {
    generateQR()
  }, [payType, paymentUrl, paypalEmail, bankIban])

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'payment_qr_code.png'
    a.click()
    toast.success('QR Code image downloaded!')
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
          <QrCode className="w-4 h-4" /> Freelancer Tools
        </div>
        <h1 className="text-2xl font-bold tracking-tight">QR Payment Code Generator</h1>
        <p className="text-sm text-muted-foreground">
          Generate scannable QR codes for your invoices so clients can scan-to-pay via mobile instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Controls Form */}
        <Card className="md:col-span-6 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payment Destination</CardTitle>
            <CardDescription className="text-xs">Choose how you want clients to pay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Method Type</Label>
              <Select value={payType} onValueChange={(val: any) => setPayType(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">Stripe / Web Payment Link URL</SelectItem>
                  <SelectItem value="paypal">PayPal.Me Username/Email</SelectItem>
                  <SelectItem value="bank">Direct Bank Wire / IBAN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payType === 'url' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Link URL</Label>
                <Input
                  value={paymentUrl}
                  onChange={e => setPaymentUrl(e.target.value)}
                  placeholder="https://buy.stripe.com/..."
                />
              </div>
            )}

            {payType === 'paypal' && (
              <div className="space-y-1.5">
                <Label className="text-xs">PayPal Email or Handle</Label>
                <Input
                  value={paypalEmail}
                  onChange={e => setPaypalEmail(e.target.value)}
                  placeholder="yourname"
                />
              </div>
            )}

            {payType === 'bank' && (
              <div className="space-y-1.5">
                <Label className="text-xs">IBAN / Account Number</Label>
                <Input
                  value={bankIban}
                  onChange={e => setBankIban(e.target.value)}
                  placeholder="IBAN details"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Result Preview */}
        <Card className="md:col-span-6 border-border/50 shadow-sm flex flex-col items-center justify-center text-center">
          <CardContent className="p-8 space-y-4 flex flex-col items-center">
            {qrDataUrl ? (
              <div className="p-4 rounded-xl border border-border/50 bg-white shadow-md">
                {/* eslint-disable-next-next/no-img-element */}
                <img src={qrDataUrl} alt="Payment QR Code" className="w-52 h-52 object-contain" />
              </div>
            ) : (
              <div className="w-52 h-52 bg-muted rounded-xl flex items-center justify-center">
                <QrCode className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
              </div>
            )}

            <p className="text-xs text-muted-foreground max-w-xs truncate font-mono">
              {getTargetText()}
            </p>

            <Button onClick={handleDownload} disabled={!qrDataUrl} className="gap-2">
              <Download className="w-4 h-4" /> Download High-Res PNG
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
