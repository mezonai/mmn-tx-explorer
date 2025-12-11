import { IPaginatedResponse } from '@/types';
import { CreateOfferRequest, IP2POfferListParams, P2POffer } from './types';
import { apiDongClient } from '@/service';
import { P2P_ENDPOINTS } from './constants';
import { P2POrder, CreateOrderRequest, UpdateOrderStatusRequest } from './types';

export class P2PService {
  // Offer methods
  static async getOffers(params: IP2POfferListParams): Promise<IPaginatedResponse<P2POffer[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<P2POffer[]>>(P2P_ENDPOINTS.OFFERS, { params });
    return data;
  }

  static async createOffers(offerData: CreateOfferRequest): Promise<P2POffer> {
    const { data } = await apiDongClient.post<{ data: P2POffer }>(P2P_ENDPOINTS.OFFERS, offerData);
    return data.data;
  }

  static async getOfferById(offerId: string): Promise<P2POffer> {
    const { data } = await apiDongClient.get<{ data: P2POffer }>(P2P_ENDPOINTS.OFFER_BY_ID(offerId));
    return data.data;
  }

  // Order methods
  static async createOrder(orderData: CreateOrderRequest): Promise<P2POrder> {
    console.log('Creating order with data:', orderData);
    const id = orderData.offer_id.toString();
    console.log('Using offer ID:', id);
    const { data } = await apiDongClient.post<{ data: P2POrder }>(P2P_ENDPOINTS.ORDERS(id), orderData);
    return data.data;
  }

  static async getOrderById(orderId: string): Promise<P2POrder> {
    const { data } = await apiDongClient.get<{ data: P2POrder }>(P2P_ENDPOINTS.ORDER_BY_ID(orderId));
    return data.data;
  }

  static async updateOrderStatus(orderId: string, status: string, transferCode?: string): Promise<P2POrder> {
    const updateData: UpdateOrderStatusRequest = {
      order_status: status,
    };
    if (transferCode) {
      updateData.transfer_code = transferCode;
    }
    const { data } = await apiDongClient.patch<{ data: P2POrder }>(P2P_ENDPOINTS.ORDER_STATUS(orderId), updateData);
    return data.data;
  }

  static async getMyOrders(): Promise<P2POrder[]> {
    const { data } = await apiDongClient.get<{ data: P2POrder[] }>(P2P_ENDPOINTS.MY_ORDERS);
    return data.data;
  }
}
