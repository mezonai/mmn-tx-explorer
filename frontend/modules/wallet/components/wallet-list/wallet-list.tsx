'use client';

import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { useQueryParam } from '@/hooks';
import { IPaginationMeta } from '@/types';
import { WalletService } from '../../api';
import { IWallet, IWalletListParams } from '../../type';
import { WalletCollection } from './list';

const DEFAULT_VALUE_DATA_SEARCH: IWalletListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'balance',
  sort_order: ESortOrder.DESC,
  force_consistent_data: true,
} as const;

export const WalletList = () => {
  const [wallets, setWallets] = useState<IWallet[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<IWalletListParams>();
  const { value: page, handleChangeValue: handleChangePage } = useQueryParam<number>({
    queryParam: 'page',
    defaultValue: PAGINATION.DEFAULT_PAGE,
  });
  const { value: limit, handleChangeValue: handleChangeLimit } = useQueryParam<number>({
    queryParam: 'limit',
    defaultValue: PAGINATION.DEFAULT_LIMIT,
    clearParams: ['page'],
  });

  const handleFetchWallets = async (params: IWalletListParams) => {
    try {
      setIsLoading(true);
      setWallets(undefined);
      const { data, meta } = await WalletService.getWallets({
        ...params,
        page: params.page - 1,
      });
      setWallets(data);
      setPagination(meta);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    });
  }, [page, limit]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchWallets(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-8">
      <h1 className="mb-0 text-2xl font-semibold">Top accounts</h1>

      <div className="space-y-6">
        <div className="bg-background sticky top-0 z-10 mb-0 flex justify-end gap-5 pt-8 pb-6">
          <Pagination
            page={page}
            limit={limit}
            totalPages={pagination?.total_pages ?? 0}
            totalItems={pagination?.total_items ?? 0}
            isLoading={isLoading}
            className="w-full lg:w-auto"
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
          />
        </div>

        <WalletCollection wallets={wallets} skeletonLength={limit} />
      </div>
    </div>
  );
};
