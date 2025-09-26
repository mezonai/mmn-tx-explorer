import Link from 'next/link';

import { AppLogo } from '@/components/shared';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ROUTES } from '@/configs/routes.config';

export function AppHeader() {
  return (
    <header className="bg-background flex h-16 shrink-0 items-center justify-between gap-4 border-b p-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:hidden">
      <div>
        <Link href={ROUTES.HOME}>
          <AppLogo />
        </Link>
      </div>

      <div>
        <SidebarTrigger />
      </div>
    </header>
  );
}
