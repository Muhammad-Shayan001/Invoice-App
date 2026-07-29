import { ReactNode } from 'react'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Receipt, Users, LayoutDashboard, Settings, LogOut, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const NavLinks = () => (
    <>
      <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-primary/10 transition-all hover:text-primary">
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
      <Link href="/clients" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Users className="h-4 w-4" />
        Clients
      </Link>
      <Link href="/invoices" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Receipt className="h-4 w-4" />
        Invoices
      </Link>
      <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary mt-auto">
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </>
  )

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Receipt className="h-6 w-6 text-primary" />
              <span className="">Invoicer</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2 pt-4">
              <NavLinks />
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <form action={logout}>
              <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="shrink-0 md:hidden" />
              }
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] mb-4">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <Receipt className="h-6 w-6 text-primary" />
                  <span className="">Invoicer</span>
                </Link>
              </div>
              <nav className="grid gap-2 text-lg font-medium">
                <NavLinks />
              </nav>
              <div className="mt-auto pt-4 border-t">
                <form action={logout}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  )
}
