'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from './footer';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', current: true },
    { name: 'Transactions', href: '/transactions', current: false },
    { name: 'Analytics', href: '/analytics', current: false },
    { name: 'Documents', href: '/documents', current: false },
    { name: 'Users', href: '/users', current: false },
    { name: 'Settings', href: '/settings', current: false },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-background fixed inset-y-0 left-0 z-50 w-64 transform border-r transition-transform duration-300 ease-in-out md:static md:inset-0 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
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
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
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
              <div className="bg-muted h-8 w-8 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-muted-foreground text-xs">
                  user@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="ml-2 flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                <span className="text-sm font-bold">M</span>
              </div>
              <span className="hidden font-semibold sm:inline-block">
                MMN Explorer
              </span>
            </div>

            {/* Navigation */}
            <nav className="ml-6 hidden items-center gap-4 md:flex">
              <a
                href="#"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
              >
                Transactions
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
              >
                Analytics
              </a>
            </nav>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <span className="sr-only">Notifications</span>
                <div className="bg-muted h-4 w-4 rounded-full" />
              </Button>
              <Button variant="ghost" size="icon">
                <span className="sr-only">User menu</span>
                <div className="bg-muted h-6 w-6 rounded-full" />
              </Button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            <div className="container mx-auto px-4 py-6">{children}</div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
