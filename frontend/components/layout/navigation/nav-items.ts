import { ArrowLeftRight, Box, CircleGauge } from 'lucide-react';

import { RoutePath, ROUTES } from '@/config/routes';

export interface NavItem {
  title: string;
  href: RoutePath;
  icon: React.ComponentType<{ className?: string }>;
}

export const sidebarNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: ROUTES.HOME,
    icon: CircleGauge,
  },
  {
    title: 'Transactions',
    href: ROUTES.TRANSACTIONS,
    icon: ArrowLeftRight,
  },
  {
    title: 'Blocks',
    href: ROUTES.BLOCKS,
    icon: Box,
  },
];
