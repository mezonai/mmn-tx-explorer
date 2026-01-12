import { IPaginatedResponse } from '@/types';
import {
  CreateOfferRequest,
  CreateOfferResponse,
  IP2POfferListParams,
  P2POffer,
  P2POrder,
  UpdateOfferStatusRequest,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
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

  static async getOfferById(offerId: string): Promise<P2POffer> {
    const { data } = await apiDongClient.get<{ data: P2POffer }>(P2P_ENDPOINTS.OFFER_BY_ID(offerId));
    return data.data;
  }

  static async cancelOffer(offerId: string): Promise<P2POffer> {
    const { data } = await apiDongClient.patch<{ data: P2POffer }>(P2P_ENDPOINTS.CANCEL_OFFER(offerId));
    return data.data;
  }

  // Order methods
  static async createOrder(offerId: string | number, orderData: CreateOrderRequest): Promise<P2POrder> {
    const { data } = await apiDongClient.post<{ order: P2POrder }>(
      P2P_ENDPOINTS.CREATE_ORDER(String(offerId)),
      orderData
    );
    return data.order;
  }

  static async getOrderById(orderId: string): Promise<P2POrder> {
    const { data } = await apiDongClient.get<{ data: P2POrder }>(P2P_ENDPOINTS.ORDER_BY_ID(orderId));
    return data.data;
  }

  static async updateOrderStatus(orderId: string, status: string, transferCode?: string): Promise<P2POrder> {
    const updateData: UpdateOrderStatusRequest = {
      status: status,
    };
    if (transferCode) {
      updateData.transfer_code = transferCode;
    }
    const { data } = await apiDongClient.post<{ data: P2POrder }>(P2P_ENDPOINTS.ORDER_STATUS(orderId), updateData);
    return data.data;
  }
}
