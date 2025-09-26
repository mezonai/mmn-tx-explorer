import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse, IResultResponse } from '@/types';
import { WALLET_ENDPOINTS } from './constants';
import { IWallet, IWalletDetails, IWalletListParams } from './type';

export class WalletService {
  static async getWallets(params: IWalletListParams): Promise<IPaginatedResponse<IWallet[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<IWallet[]>>(buildPathWithChain(WALLET_ENDPOINTS.LIST), {
      params,
    });
    return data;
  }

  static async getWalletDetails(address: string): Promise<IResultResponse<IWalletDetails>> {
    const { data } = await apiClient.get<IResultResponse<IWalletDetails>>(
      buildPathWithChain(WALLET_ENDPOINTS.DETAILS(address))
    );
    return data;
  }
}
