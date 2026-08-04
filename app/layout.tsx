import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { ToastProvider } from '@/components/toast'
import QueryClientProviderWrapper from './query-client-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Invoicer - Freelance Client & Invoice Manager',
  description: 'Manage your freelance clients, invoices, and earnings all in one place.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn('min-h-screen bg-background font-sans antialiased', inter.variable)}
      >
        <ToastProvider>
          <QueryClientProviderWrapper>
            {children}
          </QueryClientProviderWrapper>
        </ToastProvider>
      </body>
    </html>
  )
}