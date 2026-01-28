import { CobarService } from "../api";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import type { ProductResponse } from "../types";

export const useTopProducts = () => {
  const { data, isLoading } = useQuery<ProductResponse[]>({
    queryKey: [QUERY_KEYS.COBAR_TOP_PRODUCTS],
    queryFn: () => CobarService.getTopProducts(),
  });
    return {
    topProducts: data || [],
    isLoading,
  };
}