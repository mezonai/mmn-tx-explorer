"use client";

import { BarChart3, FileText, Home, Settings, Users, Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

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
];

interface SidebarProps {
  children: React.ReactNode;
}

export function AppSidebar({ children }: SidebarProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>
          {/* Logo Section */}
          <SidebarGroup>
            <div className="flex h-16 items-center px-4 border-b group-data-[collapsible=icon]:px-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                  <span className="text-sm font-bold size-5 flex items-center justify-center">M</span>
                </div>
                <span className="font-semibold">MMN Explorer</span>
              </div>
            </div>
          </SidebarGroup>

          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href={item.href}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.title}
                        </a>
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* User Section */}
          <SidebarGroup className="mt-auto">
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">User Name</p>
                  <p className="text-xs text-muted-foreground truncate">user@example.com</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
