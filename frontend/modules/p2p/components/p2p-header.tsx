'use client';

import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { Bolt, Bell } from 'lucide-react';

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
            <h1 className="text-foreground text-2xl font-bold dark:text-white">Mezon P2P</h1>
          </div>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
          <div className="flex items-center gap-4">
            <a href="#" className="text-foreground hover:text-brand-primary font-medium dark:text-white">
              P2P Trading
            </a>
            <a href="#" className="hover:text-foreground text-gray-500 dark:text-gray-400 dark:hover:text-white">
              Express
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="hover:text-foreground text-gray-500 dark:text-gray-400 dark:hover:text-white">
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <img
              src="https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
              alt="User avatar"
              className="h-8 w-8 rounded-full"
            />
            <span className="text-gray-600 dark:text-gray-300">user.name</span>
          </div>
        </div>
      </div>
    </div>
  );
};
