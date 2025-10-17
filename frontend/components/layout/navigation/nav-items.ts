import { ComponentType, SVGProps } from 'react';

import { Award04, BarChartSquare02, CreditCardRefresh, Cube01 } from '@/assets/icons';
import { ROUTES } from '@/configs/routes.config';
import { CircleDollarSign, RefreshCcw, Sprout } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  target?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
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

export const navGroupItems: NavGroup[] = [
  {
    title: 'Explorer',
    items: [
      {
        title: 'Dashboard',
        href: ROUTES.HOME,
        icon: BarChartSquare02,
      },
    ],
  },
  {
    title: 'Finance',
    items: [
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
    ],
  },
  {
    title: 'Community',
    items: [
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
    ],
  },
  {
    title: 'Ecosystem',
    items: [
      {
        title: 'Cobar.vn',
        href: 'https://cobar.vn',
        target: '_blank',
        icon: BarChartSquare02,
      },
      {
        title: 'Mezon Game',
        href: 'https://top.mezon.ai',
        target: '_blank',
        icon: BarChartSquare02,
      },
      {
        title: 'Developer',
        href: 'https://mezon.ai/developers',
        target: '_blank',
        icon: BarChartSquare02,
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        title: 'Profile',
        href: '#',
        icon: BarChartSquare02,
      },
    ],
  },
];
