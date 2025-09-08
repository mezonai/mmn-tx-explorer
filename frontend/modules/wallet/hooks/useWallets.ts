import { useQuery } from '@tanstack/react-query';
import { WALLETS_QUERY_KEY } from '../constants';
import { IWalletListParams } from '../type';
import { WalletService } from '../api';

export const useWallets = (params: IWalletListParams) => {
  return useQuery({
    queryKey: [WALLETS_QUERY_KEY, params],
    queryFn: () =>
      WalletService.getWallets({
        ...params,
        page: params.page - 1,
      }),
    enabled: !!params,
  });
};
