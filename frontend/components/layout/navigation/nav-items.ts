import { BarChartSquare02, CreditCardRefresh, Cube01 } from '@/assets/icons';
import { RoutePath, ROUTES } from '@/configs/routes.config';

export interface NavItem {
  title: string;
  href: RoutePath;
  icon: React.ComponentType<{ className?: string; color?: string }>;
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
