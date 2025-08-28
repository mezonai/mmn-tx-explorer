import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { WALLET_ENDPOINTS } from './constants';
import { IWallet, IWalletListParams } from './type';

export class WalletService {
  static async getWallets(params: IWalletListParams): Promise<IPaginatedResponse<IWallet[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<IWallet[]>>(buildPathWithChain(WALLET_ENDPOINTS.LIST), {
      params,
    });
    return data;
  }
}
