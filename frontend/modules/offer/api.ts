import { apiDongClient } from '@/service';
import { OFFER_ENDPOINTS } from './constants';
import { ICreateOfferRequest, IOffer } from './types';

// Backend wraps responses in { code, message, data }
export interface IOfferCreateResponse {
  code: number;
  message: string;
  data: IOffer;
}

export class OfferService {
  static async createOffer(req: ICreateOfferRequest): Promise<IOffer> {
    const { data } = await apiDongClient.post<IOfferCreateResponse>(OFFER_ENDPOINTS.CREATE, req);
    return data.data;
  }

  // Convenience helper: fetch list of offers (optional implementation)
  static async listOffers(params?: any): Promise<IOffer[]> {
    const { data } = await apiDongClient.get<{ code: number; message: string; data: IOffer[] }>(OFFER_ENDPOINTS.LIST, {
      params,
    });
    return data.data;
  }

  static async getOfferById(id: number | string): Promise<IOffer> {
    const { data } = await apiDongClient.get<{ code: number; message: string; data: IOffer }>(
      OFFER_ENDPOINTS.DETAIL(id)
    );
    return data.data;
  }

  static async confirmOffer(
    id: number | string,
    body: { execution_price?: string; source?: string; metadata?: string }
  ) {
    const { data } = await apiDongClient.post<{ code: number; message: string }>(OFFER_ENDPOINTS.CONFIRM(id), body);
    return data;
  }
}
