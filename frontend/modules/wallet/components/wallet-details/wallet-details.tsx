import { BreadcrumbNavigation } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { IBreadcrumb } from '@/types';
import { WalletDetailTabs } from './wallet-detail-tabs';

interface WalletDetailsProps {
  address: string;
}

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Wallets', href: ROUTES.WALLETS },
  { label: 'Wallet Details', href: '#' },
] as const;

export const WalletDetails = async ({ address }: WalletDetailsProps) => {
  return (
    <div className="space-y-8">
      <div className="mb-4 space-y-4">
        <div>
          <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
        </div>
      </div>

      <WalletDetailTabs walletAddress={address} />
    </div>
  );
};
