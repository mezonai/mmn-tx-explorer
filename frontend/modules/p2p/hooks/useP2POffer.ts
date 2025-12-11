import { useEffect, useState } from 'react';
import { P2PService } from '../api';
import { P2POffer } from '../types';

export const useP2POffer = (offerId: string | null) => {
  const [offer, setOffer] = useState<P2POffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOffer = async () => {
      if (!offerId) {
        setIsLoading(false);
        setOffer(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await P2PService.getOfferById(offerId);
        if (isMounted) {
          setOffer(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching P2P offer:', err);
          setError('Không thể tải thông tin offer. Vui lòng thử lại sau.');
          setOffer(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOffer();

    return () => {
      isMounted = false;
    };
  }, [offerId]);

  return { offer, isLoading, error };
};

