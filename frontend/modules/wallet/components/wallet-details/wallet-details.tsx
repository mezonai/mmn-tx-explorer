import { BackButton, BreadcrumbTrail } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { IBreadcrumb } from '@/types';
import { WalletDetailTabs } from './wallet-detail-tabs';
import { WalletService } from '../../api';

interface WalletDetailsProps {
  address: string;
}

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Wallets', href: ROUTES.WALLETS },
  { label: 'Wallet Details', href: '#' },
] as const;

export const WalletDetails = async ({ address }: WalletDetailsProps) => {
  const { data: walletDetails } = await WalletService.getWalletDetails(address);
  return (
    <div className="space-y-8">
      <div className="mb-0 space-y-4">
        <div>
          <BreadcrumbTrail breadcrumbs={breadcrumbs} className="hidden md:block" />
          <BackButton href={ROUTES.WALLETS} className="md:hidden" />
        </div>
        <h1 className="text-2xl font-semibold">Account Details</h1>
      </div>

      <WalletDetailTabs walletDetails={walletDetails} />
    </div>
  );
};
