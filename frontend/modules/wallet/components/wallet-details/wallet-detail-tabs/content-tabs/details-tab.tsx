import { AddressDisplay, RefreshButton } from '@/components/shared';
import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ROUTES } from '@/configs/routes.config';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/modules/wallet/hooks/useWallet';

interface TabDetailsProps {
  walletAddress: string;
}

export const DetailsTab = ({ walletAddress }: TabDetailsProps) => {
  const { data: walletDetailsResponse, refetch, isLoading } = useWallet(walletAddress);
  const walletDetails = walletDetailsResponse?.data;
  const hasBalance = walletDetails?.balance;

  return (
    <Card className="dark:border-primary/20">
      <CardContent>
        <CardHeader className="mb-4 flex items-center justify-between gap-2 p-0">
          <CardTitle className="text-brand-primary font-semibold tracking-wider uppercase">Account Summary</CardTitle>
          <div className="flex items-end justify-end">
            <p className="text-card-foreground rounded-lg p-1 text-xs break-words">
              Last updated block •
              <Button variant="link" className="text-brand-primary ml-0.5 size-fit p-0 text-sm font-normal" asChild>
                <Link href={ROUTES.BLOCK(Number(walletDetails?.last_balance_update ?? 0))}>
                  {walletDetails?.last_balance_update ?? 0}
                </Link>
              </Button>
            </p>
            <RefreshButton onClick={refetch} isLoading={isLoading} />
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <Card className="dark:border-primary/20">
            <CardContent>
              <CardHeader className="flex items-center justify-between gap-2 p-0">
                <CardTitle className="mb-1 text-xs uppercase">Balance</CardTitle>
              </CardHeader>
              <p className="dark:text-primary text-lg font-semibold">
                {hasBalance
                  ? `${NumberUtil.formatWithCommasAndScale(hasBalance)} ${APP_CONFIG.CHAIN_SYMBOL}`
                  : '••••••••••'}
              </p>
            </CardContent>
          </Card>

          <Card className="dark:border-primary/20">
            <CardContent>
              <CardHeader className="flex items-center justify-between gap-2 p-0">
                <CardTitle className="mb-1 text-xs uppercase">Transaction</CardTitle>
              </CardHeader>
              <p className="dark:text-primary text-lg font-semibold">{walletDetails?.transaction_count ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="dark:border-primary/20">
            <CardContent>
              <CardHeader className="flex items-center justify-between gap-2 p-0">
                <CardTitle className="mb-1 text-xs uppercase">Wallet Address</CardTitle>
              </CardHeader>
              <div className="flex items-center space-x-2">
                {walletDetails ? (
                  <AddressDisplay
                    address={walletDetails.address}
                    className="dark:text-primary text-lg font-semibold md:w-[300px]"
                  />
                ) : (
                  <div className="dark:text-primary text-lg font-semibold md:w-[300px]">N/A</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
