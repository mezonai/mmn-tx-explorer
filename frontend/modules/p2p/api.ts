import { IPaginatedResponse } from '@/types';
import { IP2POfferListParams, P2POffer } from './types';
import { apiDongClient } from '@/service';
import { P2P_ENDPOINTS } from './constants';

export class P2PService {
  static async getOffers(params: IP2POfferListParams): Promise<IPaginatedResponse<P2POffer[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<P2POffer[]>>(P2P_ENDPOINTS.OFFERS, { params });
    return data;
  }
}
