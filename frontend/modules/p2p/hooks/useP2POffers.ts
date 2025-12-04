import { useEffect, useState } from 'react';
import { P2PService } from '../api';
import { P2PFilters, P2POffer } from '../types/p2p.types';

export const useP2POffers = (filters: P2PFilters) => {
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOffers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await P2PService.getOffers({
          tradeType: filters.tradeType,
          amount: filters.amount,
          currency: filters.currency,
        });
        if (isMounted) {
          setOffers(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching P2P offers:', err);
          setError('Không thể tải danh sách offer. Vui lòng thử lại sau.');
          setOffers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOffers();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  return { offers, isLoading, error };
};
