'use client';

import Link from 'next/link';
import { AppLogo, ThemeToggle } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth, useAuthActions } from '@/providers/AppProvider';
import { NavbarMenu } from '@/components/shared/navbar';
import { SearchMd } from '@/assets/icons';

export function AppNavbar() {
  const { isAuthenticated } = useAuth();
  const { login, logout } = useAuthActions();

  return (
    <header className="bg-card border-border supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="sm:hidden">
            <SidebarTrigger />
          </div>

          <div className="flex items-center gap-4">
            <Link href={ROUTES.HOME}>
              <AppLogo />
            </Link>
            <Button onClick={() => {}} variant={'outline'} className="hidden rounded-md md:flex">
              <SearchMd className="text-foreground-quaternary-400 size-5" strokeWidth={1.5} />
              <p className="w-32 text-start">Search</p>
            </Button>
          </div>

          <nav className="hidden md:flex">
            <NavbarMenu />
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              onClick={isAuthenticated ? logout : login}
              className={`hidden md:flex ${
                !isAuthenticated
                  ? 'bg-brand-secondary-700 hover:bg-brand-secondary-700/90 font-semibold text-white shadow-xs'
                  : 'text-foreground bg-background hover:bg-active hover:text-quaternary-500 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border shadow-xs'
              }`}
            >
              {!isAuthenticated ? `Login with Mezon` : `Logout`}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
