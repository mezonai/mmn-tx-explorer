import { ComponentType, SVGProps } from 'react';

import { Award04, BarChartSquare02, CreditCardRefresh, Cube01 } from '@/assets/icons';
import { ROUTES } from '@/configs/routes.config';
import { CircleDollarSign, RefreshCcw, Sprout } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  target?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroupItems: NavGroup[] = [
  {
    title: 'Explorer',
    items: [
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
    ],
  },
  {
    title: 'Finance',
    items: [
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
        title: 'Give Coffee',
        href: ROUTES.TRANSFER,
        icon: CircleDollarSign,
      },
      {
        title: 'Donation Campaign',
        href: ROUTES.DONATION_CAMPAIGN,
      },
      {
        title: 'Lì Xì',
        href: ROUTES.LI_XI,
      },
    ],
  },
  {
    title: 'Ecosystem',
    items: [
      {
        title: 'Cobar.vn',
        href: ROUTES.COBAR,
      },
      {
        title: 'Mezon Game',
        href: ROUTES.MEZON_GAME,
      },
      {
        title: 'Developer',
        href: ROUTES.DEVELOPER,
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        title: 'Profile',
        href: ROUTES.PROFILE,
      },
    ],
  },
];
