export interface IMezonGameApp {
  id: string;
  name: string;
  type: string;
  mezonAppId: string;
  description: string;
  headline: string;
  featuredImage: string;
  pricingTag: string;
}

export interface IMezonGameListParams {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface IMezonGamePaginatedResponse {
  statusCode: number;
  message: string;
  data: IMezonGameApp[];
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
