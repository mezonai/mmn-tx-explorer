import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { DASHBOARD_ENDPOINTS } from './constants';
import { IDashboardStats } from './type';

export class DashboardService {
  static async getStats(): Promise<IPaginatedResponse<IDashboardStats>> {
    const { data } = await apiClient.get<IPaginatedResponse<IDashboardStats>>(
      buildPathWithChain(DASHBOARD_ENDPOINTS.STATS)
    );
    return data;
  }
}
