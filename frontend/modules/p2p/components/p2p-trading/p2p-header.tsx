'use client';

import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { Bolt } from 'lucide-react';

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Dashboard', href: ROUTES.HOME },
  { label: 'P2P', href: ROUTES.P2P },
];

export const P2PHeader = () => {
  return (
    <div className="space-y-4">
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-brand-primary flex h-8 w-8 items-center justify-center rounded-full">
              <Bolt className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-foreground text-2xl font-bold dark:text-white">Mezon P2P Trading</h1>
          </div>
        </div>
      </div>
    </div>
  );
};
