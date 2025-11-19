'use client';

import Link from 'next/link';
import { AppLogo } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NavbarMenu } from '@/components/shared/navbar';
import { GlobalSearch } from '@/modules/global-search/components';
import { NavBarAuthPanel } from '@/modules/auth/components';

export function AppNavbar() {
  return (
    <header className="bg-card border-border supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={ROUTES.HOME}>
              <AppLogo />
            </Link>
            <GlobalSearch className="hidden w-64 md:flex" />
          </div>

          <nav className="hidden md:flex">
            <NavbarMenu />
          </nav>

          <div className="flex items-center gap-4">
            <NavBarAuthPanel />
            <div className="sm:hidden">
              <SidebarTrigger />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
