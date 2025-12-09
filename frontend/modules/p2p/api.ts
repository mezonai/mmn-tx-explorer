import { IPaginatedResponse } from '@/types';
import { IP2POfferListParams, P2POffer } from './types';
import { P2POrder, OrderStatus, CreateOfferFormData } from './types/p2p.types';
import { apiDongClient } from '@/service';
import { P2P_ENDPOINTS } from './constants';

export class P2PService {
  static async getOffers(params: IP2POfferListParams): Promise<IPaginatedResponse<P2POffer[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<P2POffer[]>>(P2P_ENDPOINTS.OFFERS, { params });
    return data;
  }

  static async getOfferById(offerId: string): Promise<P2POffer> {
    const { data } = await apiDongClient.get<P2POffer>(P2P_ENDPOINTS.OFFER_BY_ID(offerId));
    return data;
  }

  static async createOffer(payload: CreateOfferFormData): Promise<P2POffer> {
    const { data } = await apiDongClient.post<P2POffer>(P2P_ENDPOINTS.OFFERS, payload);
    return data;
  }

  static async getOrderById(orderId: string): Promise<P2POrder> {
    const { data } = await apiDongClient.get<P2POrder>(P2P_ENDPOINTS.ORDER_BY_ID(orderId));
    return data;
  }

  static async getMyOrders(): Promise<P2POrder[]> {
    const { data } = await apiDongClient.get<P2POrder[]>(P2P_ENDPOINTS.MY_ORDERS);
    return data;
  }

  static async createOrder(payload: { offerId: string; amountMZD: number; amountVND?: number }): Promise<P2POrder> {
    const { data } = await apiDongClient.post<P2POrder>(P2P_ENDPOINTS.ORDERS, payload);
    return data;
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<P2POrder> {
    const { data } = await apiDongClient.patch<P2POrder>(P2P_ENDPOINTS.ORDER_STATUS(orderId), { status });
    return data;
  }
}
