"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { MobileSidebar } from "./mobile-sidebar"

export function Header() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          {/* Mobile menu trigger - only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Desktop sidebar trigger - only visible on desktop */}
          <SidebarTrigger className="hidden md:flex -ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          {/* Breadcrumb */}
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            <a
              href="#"
              className="hidden md:block transition-colors hover:text-foreground"
            >
              MMN Explorer
            </a>
            <span className="hidden md:block">/</span>
            <span className="text-foreground">Dashboard</span>
          </nav>
        </div>

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

      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={mobileSidebarOpen} 
        onOpenChange={setMobileSidebarOpen} 
      />
    </>
  )
}
