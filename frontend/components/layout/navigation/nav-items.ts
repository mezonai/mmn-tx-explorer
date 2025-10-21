import { ComponentType, SVGProps } from 'react';

import { Award04, BarChartSquare02, CreditCardRefresh, Cube01 } from '@/assets/icons';
import { ROUTES } from '@/configs/routes.config';
import { CircleDollarSign, RefreshCcw, Sprout, LogOut } from 'lucide-react';

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
  {
    title: 'Top accounts',
    href: ROUTES.WALLETS,
    icon: Award04,
  },
  {
    title: 'Give coffee',
    href: ROUTES.TRANSFER,
    icon: CircleDollarSign,
  },
  {
    title: 'Swap',
    href: ROUTES.SWAP,
    icon: RefreshCcw,
  },
  {
    title: 'Stake',
    href: ROUTES.STAKE,
    icon: Sprout,
  },
];
export const authenticationItems: NavItem[] = [{ title: 'Log Out', href: ROUTES.LOGOUT, icon: LogOut }];
