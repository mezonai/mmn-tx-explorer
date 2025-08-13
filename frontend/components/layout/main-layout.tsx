'use client';

import { AppFooter, AppHeader, AppSidebar } from './shared';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AppSidebar>
      <div className="flex min-h-screen flex-col">
        <AppHeader />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-6">{children}</div>
        </main>

        <AppFooter />
      </div>
    </AppSidebar>
  );
}
