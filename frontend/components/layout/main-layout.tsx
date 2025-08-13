"use client"

import { Header } from "./header"
import { AppSidebar } from "./sidebar"
import { Footer } from "./footer"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AppSidebar>
      <div className="flex min-h-screen flex-col">
        <Header />
        
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </AppSidebar>
  )
}
