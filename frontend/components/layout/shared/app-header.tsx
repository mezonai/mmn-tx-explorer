import Image from 'next/image';
import Link from 'next/link';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ROUTES } from '@/configs/routes.config';

export function AppHeader() {
  return (
    <header className="bg-background flex h-16 shrink-0 items-center justify-between gap-4 border-b p-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:hidden">
      <div>
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
      </div>

      <div>
        <SidebarTrigger />
      </div>
    </header>
  );
}
