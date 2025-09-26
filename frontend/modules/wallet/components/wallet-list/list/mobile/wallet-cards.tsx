import { IWallet } from '@/modules/wallet/type';
import { WalletCard } from './wallet-card';
import { PAGINATION } from '@/constant';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { usePaginationQueryParam } from '@/hooks';

interface WalletCardsProps {
  wallets?: IWallet[];
  skeletonLength?: number;
  isLoading: boolean;
}

export const WalletCards = ({ wallets, skeletonLength = PAGINATION.DEFAULT_LIMIT, isLoading }: WalletCardsProps) => {
  const { page, limit } = usePaginationQueryParam();
  return (
    <VirtualizedList<IWallet>
      key={`${page}-${limit}`}
      items={wallets}
      isLoading={isLoading}
      isEmpty={!isLoading && (!wallets || wallets.length === 0)}
      skeletonCount={skeletonLength}
      estimateSize={140}
      overscan={8}
      maxHeight={600}
      minItemsForVirtualization={30}
      getItemKey={(item) => item.address}
      renderItem={(item) => <WalletCard wallet={item} />}
      renderSkeletonItem={() => <WalletCard />}
      className="space-y-4"
    />
  );
};
