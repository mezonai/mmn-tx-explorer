'use client';

import { GlobalSearch } from '@/modules/global-search/components';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { AppFooter, AppHeader, AppSidebar } from './shared';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <AppHeader />

          <main className="flex-1">
            <div className="container mx-auto px-4 py-8 md:px-8">
              <GlobalSearch className="mb-5" />
              {children}
            </div>
          </main>

          <AppFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
