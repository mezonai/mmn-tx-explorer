'use client';

import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { AppFooter, AppNavbar, AppSidebar } from './shared';
import { Toaster } from 'sonner';
interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <AppNavbar />
      <AppSidebar />

      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            <div className="container mx-auto px-4 py-8 md:px-8">{children}</div>
          </main>

          <AppFooter />
        </div>
      </SidebarInset>
      <Toaster richColors />
    </SidebarProvider>
  );
}
