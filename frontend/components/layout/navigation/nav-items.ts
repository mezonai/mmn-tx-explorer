import { ComponentType, SVGProps } from 'react';

import { BarChartSquare02, CreditCardRefresh, Cube01 } from '@/assets/icons';
import { ROUTES } from '@/configs/routes.config';

export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const sidebarNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: ROUTES.HOME,
    icon: BarChartSquare02,
  },
  {
    title: 'Transactions',
    href: ROUTES.TRANSACTIONS,
    icon: CreditCardRefresh,
  },
  {
    title: 'Blocks',
    href: ROUTES.BLOCKS,
    icon: Cube01,
  },
];
