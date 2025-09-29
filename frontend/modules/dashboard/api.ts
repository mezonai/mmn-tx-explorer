import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { DASHBOARD_ENDPOINTS } from './constants';
import { IDashboardStats, ITransactionStats } from './type';

export class DashboardService {
  static async getStats(): Promise<IPaginatedResponse<IDashboardStats>> {
    const { data } = await apiClient.get<IPaginatedResponse<IDashboardStats>>(
      buildPathWithChain(DASHBOARD_ENDPOINTS.DB_STATS)
    );
    return data;
  }

  static async getTxStats(): Promise<IPaginatedResponse<ITransactionStats>> {
    const { data } = await apiClient.get<IPaginatedResponse<ITransactionStats>>(
      buildPathWithChain(DASHBOARD_ENDPOINTS.TX_STATS)
    );
    return data;
  }
}
