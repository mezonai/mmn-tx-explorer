import { useQuery } from '@tanstack/react-query';
import { WalletService } from '../api';

export const useWallet = (wallet_address: string) => {
  return useQuery({
    queryKey: [wallet_address],
    queryFn: () => WalletService.getWalletDetails(wallet_address),
    enabled: !!wallet_address,
  });
};
