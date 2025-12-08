'use client';

import { useState } from 'react';
import { useUser } from '@/providers/AppProvider';
import { P2PService } from '../api';
import { P2POffer, CreateOfferFormData } from '../types/p2p.types';

export const useCreateOffer = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const createOffer = async (payload: CreateOfferFormData): Promise<P2POffer | null> => {
    if (!user?.walletAddress) {
      throw new Error('User wallet not available');
    }

    setIsLoading(true);

    try {
      const offer = await P2PService.createOffer(payload);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOffer, isLoading };
};

