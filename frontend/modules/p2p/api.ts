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
  UserPaymentInfo,
} from './types';
import { apiDongClient, apiChatClient } from '@/service';
import { P2P_ENDPOINTS, CHAT_ENDPOINTS } from './constants';
import { MessageWithParsedContent } from './types';

export class ChatService {
  static async findChannel(params: { offerCreatorId: string; orderCreatorId: string }): Promise<string | null> {
    const { data } = await apiChatClient.get<{ channelId: string | null }>(CHAT_ENDPOINTS.FIND_CHANNEL, { params });
    return data.channelId;
  }

  static async getHistory(
    channelId: string,
    params?: { limit?: number; before?: number }
  ): Promise<MessageWithParsedContent[]> {
    const { data } = await apiChatClient.get<MessageWithParsedContent[]>(CHAT_ENDPOINTS.HISTORY(channelId), { params });
    return data;
  }
}

export class P2PService {
  static async getMyPaymentInfos(): Promise<UserPaymentInfo[]> {
    const { data } = await apiDongClient.get<{ data: UserPaymentInfo[] }>(P2P_ENDPOINTS.USER_PAYMENTS_ME);
    return data.data;
  }

  static async updatePaymentInfo(paymentData: Partial<UserPaymentInfo>): Promise<UserPaymentInfo> {
    const { data } = await apiDongClient.post<{ data: UserPaymentInfo }>(P2P_ENDPOINTS.USER_PAYMENTS, paymentData);
    return data.data;
  }

  static async deletePaymentInfo(id: string | number): Promise<void> {
    await apiDongClient.delete(P2P_ENDPOINTS.DELETE_USER_PAYMENT(String(id)));
  }

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
  static async getOrdersByOffer(offerId: string): Promise<P2POrder[]> {
    const { data } = await apiDongClient.get<{ data: P2POrder[] }>(P2P_ENDPOINTS.ORDERS_BY_OFFER(offerId));
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

  static async reopenOrder(orderId: string): Promise<void> {
    await apiDongClient.post(P2P_ENDPOINTS.REOPEN_ORDER(orderId));
  }
}
