'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChevronLeft } from '@/assets/icons';
import { AppLogo } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';
import { sidebarNavItems } from '../navigation/nav-items';

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
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

        <div className="pointer-events-none absolute top-1/2 right-0 hidden translate-x-1/2 -translate-y-1/2 md:block md:opacity-0 md:transition-opacity md:group-hover:pointer-events-auto md:group-hover:opacity-100">
          <Button variant="outline" size="icon" className="aspect-square size-fit p-1.5" onClick={toggleSidebar}>
            <ChevronLeft
              className={cn(
                'text-foreground-quaternary-400 size-4 transition-transform',
                state === 'collapsed' && 'rotate-180'
              )}
            />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarNavItems.map(({ href, icon: Icon, title }) => {
                const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={title}
                      className={cn(
                        'hover:bg-active w-full justify-start gap-3 rounded-[6px] px-3 py-2 transition-all duration-200',
                        isActive && 'bg-active'
                      )}
                    >
                      <Button variant="ghost" className="h-auto w-full justify-start" asChild>
                        <Link href={href}>
                          <div className="flex aspect-square size-5 items-center justify-center">
                            <Icon
                              className={cn(
                                'text-foreground-quaternary-400 !size-full',
                                isActive && 'text-foreground-brand-secondary_hover'
                              )}
                              strokeWidth={2}
                            />
                          </div>
                          <span
                            className={cn('text-secondary-700 font-semibold', isActive && 'text-brand-secondary_hover')}
                          >
                            {title}
                          </span>
                        </Link>
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
