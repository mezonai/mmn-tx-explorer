import Link from 'next/link';

import { Cube01 } from '@/assets/icons';
import { AddressDisplay, ItemAttribute } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { IWalletDetails } from '@/modules/wallet/type';
import { NumberUtil } from '@/utils';
import { TxnLink } from '../../../wallet-list/list/shared';
import { Skeleton } from '@/components/ui/skeleton';

interface TabDetailsProps {
  walletDetails: IWalletDetails;
}

export const DetailsTab = ({ walletDetails }: TabDetailsProps) => {
  return (
    <div className="space-y-4 md:min-h-[600px]">
      <ItemAttribute
        label="Address"
        description="The address of the account"
        data={walletDetails.address}
        render={(address) => <AddressDisplay address={address} className="w-[300px]" />}
        skeleton={<Skeleton className="h-5 w-30" />}
      />

      <ItemAttribute
        label="Balance"
        description={`${APP_CONFIG.CHAIN_SYMBOL} balance`}
        data={walletDetails}
        render={(walletDetails) => (
          <span>
            {NumberUtil.formatWithCommasAndScale(walletDetails?.balance ?? 0)} {APP_CONFIG.CHAIN_SYMBOL}
          </span>
        )}
        skeleton={<Skeleton className="h-5 w-20" />}
      />

      <ItemAttribute
        label="Transactions"
        description="Number of transactions related to this address"
        data={walletDetails}
        render={(walletDetails) => (
          <TxnLink address={walletDetails.address} accountNonce={walletDetails?.transaction_count ?? 0} />
        )}
        skeleton={<Skeleton className="h-5 w-50" />}
      />

      <ItemAttribute
        label="Last balance update"
        description="Block number in which the address was updated"
        data={walletDetails}
        render={(walletDetails) => (
          <div className="flex items-center gap-1">
            <Cube01 className="text-foreground-quaternary-400 size-4" />
            <Button variant="link" className="text-brand-secondary-700 size-fit p-0 text-sm font-normal" asChild>
              <Link href={ROUTES.BLOCK(Number(walletDetails?.last_balance_update ?? 0))}>
                {walletDetails?.last_balance_update ?? 0}
              </Link>
            </Button>
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-50" />}
      />
    </div>
  );
};
