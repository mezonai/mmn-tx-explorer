import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { SEARCH_ENDPOINTS } from './constants';
import { ISearchResult } from './types';

export class SearchService {
  static async search(input: string): Promise<IPaginatedResponse<ISearchResult>> {
    const { data } = await apiClient.get<IPaginatedResponse<ISearchResult>>(
      buildPathWithChain(SEARCH_ENDPOINTS.LIST, '1337').replace(':input', input)
    );
    return data;
  }
}
