import { IPaginatedResponse } from '@/types';
import {
  CreateOfferRequest,
  CreateOfferResponse,
  IP2POfferListParams,
  P2POffer,
  P2POrder,
  UpdateOfferStatusRequest,
} from './types';
import { apiDongClient } from '@/service';
import { P2P_ENDPOINTS } from './constants';

export class P2PService {
  static async getOffers(params: IP2POfferListParams): Promise<IPaginatedResponse<P2POffer[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<P2POffer[]>>(P2P_ENDPOINTS.OFFERS, { params });
    return data;
  }
  static async createOffers(offerData: CreateOfferRequest): Promise<CreateOfferResponse> {
    const { data } = await apiDongClient.post<{ data: CreateOfferResponse }>(P2P_ENDPOINTS.OFFERS, offerData);
    return data.data;
  }
  static async updateOfferStatus(payload: UpdateOfferStatusRequest) {
    const { data } = await apiDongClient.post(P2P_ENDPOINTS.UPDATE_OFFER_STATUS, payload);
    return data;
  }
  static async getMyOffers(params: IP2POfferListParams): Promise<IPaginatedResponse<P2POffer[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<P2POffer[]>>(P2P_ENDPOINTS.MY_OFFERS, { params });
    return data;
  }
  static async getMyOrders(params: IP2POfferListParams): Promise<IPaginatedResponse<P2POrder[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<P2POrder[]>>(P2P_ENDPOINTS.MY_ORDERS, { params });
    return data;
  }
}
