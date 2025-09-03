import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Cube01 } from '@/assets/icons';
import { AddressDisplay, ItemAttribute } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { WalletService } from '@/modules/wallet/api';
import { IWalletDetails } from '@/modules/wallet/type';
import { NumberUtil } from '@/utils';
import { TxnLink } from '../../../wallet-list/list/shared';
import { Skeleton } from '@/components/ui/skeleton';

interface TabDetailsProps {
  address: string;
}

export const DetailsTab = ({ address }: TabDetailsProps) => {
  const [walletDetails, setWalletDetails] = useState<IWalletDetails>();

  const fetchWalletDetails = async (address: string) => {
    try {
      const { data } = await WalletService.getWalletDetails(address);
      setWalletDetails(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWalletDetails(address);
  }, [address]);

  return (
    <div className="space-y-4">
      <ItemAttribute label="Address" tooltip="The address of the account">
        <AddressDisplay address={address} className="w-[300px]" />
      </ItemAttribute>
      <ItemAttribute label="Balance" tooltip={`${APP_CONFIG.CHAIN_SYMBOL} balance`}>
        {walletDetails ? (
          <span>
            {NumberUtil.formatWithCommas(walletDetails?.balance ?? 0)} {APP_CONFIG.CHAIN_SYMBOL}
          </span>
        ) : (
          <Skeleton className="h-5 w-50" />
        )}
      </ItemAttribute>
      <ItemAttribute label="Transactions" tooltip="Number of transactions related to this address">
        {walletDetails ? (
          <TxnLink address={address} accountNonce={walletDetails?.account_nonce ?? 0} />
        ) : (
          <Skeleton className="h-5 w-50" />
        )}
      </ItemAttribute>
      <ItemAttribute label="Last balance update" tooltip="Block number in which the address was updated">
        {walletDetails ? (
          <div className="flex items-center gap-1">
            <Cube01 className="text-foreground-quaternary-400 size-4" />
            <Button variant="link" className="text-brand-secondary-700 size-fit p-0 text-sm font-normal" asChild>
              <Link href={ROUTES.BLOCK(Number(walletDetails?.last_balance_update ?? 0))}>
                {walletDetails?.last_balance_update ?? 'N/A'}
              </Link>
            </Button>
          </div>
        ) : (
          <Skeleton className="h-5 w-50" />
        )}
      </ItemAttribute>
    </div>
  );
};
