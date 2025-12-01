// Response types based on the API structure (simplified)
export interface IMezonGameApp {
  id: string;
  name: string;
  type: string;
  mezonAppId: string;
  description: string;
  headline: string;
  featuredImage: string;
  // Add other relevant fields as needed
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
