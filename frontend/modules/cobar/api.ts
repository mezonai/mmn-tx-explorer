import { cobarClient } from '@/service';
import { COBAR_ENDPOINTS } from './constants';
import { ProductResponse, CobarStats } from './types';

export class CobarService {
  static async getTopProducts(): Promise<ProductResponse[]> {
    const { data } = await cobarClient.get<{ products: ProductResponse[] }>(COBAR_ENDPOINTS.TOP_PRODUCTS);
    return data.products;
  }
  static async getStats(): Promise<CobarStats> {
    const { data } = await cobarClient.get<{ metrics: CobarStats }>(COBAR_ENDPOINTS.STATS);
    return data.metrics;
  }
}
