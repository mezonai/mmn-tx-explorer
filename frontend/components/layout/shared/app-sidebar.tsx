'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChevronLeft } from '@/assets/icons';
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
                <div className="flex items-center gap-3">
                  <div className="flex aspect-square size-9 items-center justify-center overflow-hidden rounded-lg">
                    <Image src="/images/logo.webp" alt="MMN Explorer Logo" width={36} height={36} />
                  </div>
                  <div className="flex-1">
                    <span className="text-primary truncate text-xl font-bold">MMN Explorer</span>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="pointer-events-none absolute top-1/2 right-0 hidden translate-x-1/2 -translate-y-1/2 md:block md:opacity-0 md:transition-opacity md:group-hover:pointer-events-auto md:group-hover:opacity-100">
          <Button variant="outline" size="icon" className="aspect-square size-fit p-1.5" onClick={toggleSidebar}>
            <ChevronLeft
              className={cn('text-muted-foreground size-4 transition-transform', state === 'collapsed' && 'rotate-180')}
            />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarNavItems.map((item) => {
                const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        'w-full justify-start gap-3 rounded-[6px] px-3 py-2 transition-all duration-200',
                        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'
                      )}
                    >
                      <Button variant="ghost" className="h-auto w-full justify-start" asChild>
                        <Link href={item.href}>
                          <div className="flex aspect-square size-5 items-center justify-center">
                            <item.icon
                              className={cn('!size-full', isActive ? 'text-primary' : 'text-muted-foreground')}
                            />
                          </div>
                          <span className={cn('font-semibold', isActive && 'text-primary')}>{item.title}</span>
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
