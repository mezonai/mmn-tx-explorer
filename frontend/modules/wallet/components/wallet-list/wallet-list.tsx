'use client';

import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { usePaginationQueryParam } from '@/hooks';
import { IWalletListParams } from '../../type';
import { WalletCollection } from './list';
import { useWallets } from '../../hooks/useWallets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEFAULT_VALUE_DATA_SEARCH: IWalletListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_count',
  sort_order: ESortOrder.DESC,
  force_consistent_data: true,
} as const;

export const WalletList = () => {
  const [localSearchParams, setLocalSearchParams] = useState<IWalletListParams>();
  const { data: walletsResponse, isLoading: isLoadingWallets } = useWallets(
    localSearchParams ?? DEFAULT_VALUE_DATA_SEARCH
  );
  const wallets = walletsResponse?.data;
  const pagination = walletsResponse?.meta;
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    });
  }, [page, limit]);
  return (
    <Card className="dark:border-primary/20">
      <CardContent className="overflow-x-hidden">
        <CardHeader className="mb-4 flex items-center justify-between gap-2 p-0">
          <CardTitle className="text-brand-primary font-semibold tracking-wider uppercase">Top accounts</CardTitle>
        </CardHeader>
        <div className="space-y-6">
          <div className="sticky top-0 z-10 mb-0 flex justify-end gap-5 py-6 md:pt-8">
            <Pagination
              page={page}
              limit={limit}
              totalPages={pagination?.total_pages ?? 0}
              totalItems={pagination?.total_items ?? 0}
              isLoading={isLoadingWallets}
              className="w-full lg:w-auto"
              onChangePage={handleChangePage}
              onChangeLimit={handleChangeLimit}
            />
          </div>

          <WalletCollection wallets={wallets} isLoading={isLoadingWallets} />
        </div>
      </CardContent>
    </Card>
  );
};
