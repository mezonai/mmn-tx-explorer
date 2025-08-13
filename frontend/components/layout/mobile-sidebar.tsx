"use client"

import {
  BarChart3,
  FileText,
  Home,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: Wallet,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <span className="text-sm font-bold">M</span>
            </div>
            <span className="font-semibold">MMN Explorer</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Navigation</h3>
              {sidebarNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={item.href} onClick={() => onOpenChange(false)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </a>
                </Button>
              ))}
            </div>
          </nav>

          {/* User Section */}
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
      </SheetContent>
    </Sheet>
  )
}
