'use client';

import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  BarChart3,
  ChevronDown,
  FileText,
  Home,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Transactions',
    href: '/transactions',
    icon: Wallet,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/settings',
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
        <SidebarHeader className="border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <span>M</span>
                  </div>
                  <div className="flex-1">
                    <span className="truncate font-medium">MMN Explorer</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                      >
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
        </SidebarContent>

        <SidebarFooter>
          <SidebarGroup className="mt-auto">
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <div className="bg-muted h-8 w-8 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">User Name</p>
                  <p className="text-muted-foreground truncate text-xs">
                    user@example.com
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
