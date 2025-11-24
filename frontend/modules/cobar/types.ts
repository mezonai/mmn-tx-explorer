export interface ProductResponse {
  product_id: string;
  name: string;
  thumbnail: string;
  total_quantity: number;
  total_revenue: number;
}

export interface CobarStats {
  total_users: number;
  total_orders: number;
  total_amount: number;
}
