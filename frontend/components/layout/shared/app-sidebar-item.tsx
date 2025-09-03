'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useRouteMatcher } from '@/hooks';
import { cn } from '@/lib/utils';
import { NavItem } from '../navigation/nav-items';

interface AppSidebarItemProps {
  item: NavItem;
}

export function AppSidebarItem({ item }: AppSidebarItemProps) {
  const isActive = useRouteMatcher(item.href);

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
              <item.icon className={cn('!size-full', isActive ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <span className={cn('font-semibold', isActive && 'text-primary')}>{item.title}</span>
          </Link>
        </Button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
