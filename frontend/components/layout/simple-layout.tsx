"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "./footer"

interface SimpleLayoutProps {
  children: React.ReactNode
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/", current: true },
    { name: "Transactions", href: "/transactions", current: false },
    { name: "Analytics", href: "/analytics", current: false },
    { name: "Documents", href: "/documents", current: false },
    { name: "Users", href: "/users", current: false },
    { name: "Settings", href: "/settings", current: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-background border-r transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                <span className="text-sm font-bold">M</span>
              </div>
              <span className="font-semibold">MMN Explorer</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sidebar navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.current
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-muted-foreground">user@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 ml-2">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                <span className="text-sm font-bold">M</span>
              </div>
              <span className="hidden font-semibold sm:inline-block">
                MMN Explorer
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-4 ml-6">
              <a
                href="#"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Transactions
              </a>
              <a
                href="#"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Analytics
              </a>
            </nav>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <span className="sr-only">Notifications</span>
                <div className="h-4 w-4 rounded-full bg-muted" />
              </Button>
              <Button variant="ghost" size="icon">
                <span className="sr-only">User menu</span>
                <div className="h-6 w-6 rounded-full bg-muted" />
              </Button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  )
}
