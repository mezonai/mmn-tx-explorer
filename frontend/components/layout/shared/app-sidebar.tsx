'use client';

import Link from 'next/link';

import { AppLogo } from '@/components/shared';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/configs/routes.config';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { navGroupItems } from '../navigation/nav-items';
import { NavbarItem } from '@/components/shared/navbar';
import { GlobalSearch } from '@/modules/global-search/components';
import { SidebarAuthPanel } from '@/modules/auth/components';

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="lg:hidden">
      <SidebarHeader className="relative px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={ROUTES.HOME}>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="justify-between px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <GlobalSearch className="mb-5 w-full" />
            <Accordion type="multiple" className="w-full">
              {navGroupItems.map((group, index) => (
                <AccordionItem key={group.title} value={`item-${index}`} className="border-none">
                  <AccordionTrigger className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium hover:no-underline">
                    {group.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="ml-4 space-y-1">
                      {group.items.map((item) => (
                        <NavbarItem key={item.href} item={item} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarAuthPanel />
      </SidebarFooter>
    </Sidebar>
  );
}
