export interface IMezonGameApp {
  id: string;
  name: string;
  type: string;
  mezonAppId: string;
  description: string;
  headline: string;
  featuredImage: string;
  pricingTag: string;
  tags: { id: string; name: string }[];
}

export interface IMezonGameListParams {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  type?: string;
  tags?: string[];
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
export interface IMezonGameTag {
  id: string;
  name: string;
  slug: string;
  botCount: number;
}
export interface IMezonGameTagResponse {
  statusCode: number;
  message: string;
  data: IMezonGameTag[];
}
