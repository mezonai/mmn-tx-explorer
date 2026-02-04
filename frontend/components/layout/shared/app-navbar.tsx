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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex h-12 items-center justify-between gap-2 sm:h-14 sm:gap-3 lg:h-16 lg:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-4">
            <Link href={ROUTES.HOME} className="flex-shrink-0">
              <AppLogo />
            </Link>
            <GlobalSearch className="hidden w-64 lg:flex" />
          </div>

          <nav className="hidden lg:flex">
            <NavbarMenu />
          </nav>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
            <NavBarAuthPanel />
            <div className="lg:hidden">
              <SidebarTrigger />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
