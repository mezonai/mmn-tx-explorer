import { useState, useEffect } from 'react';
import { P2POffer, P2POrder } from '../types/p2p.types';

// Mock function to get offer by ID
const getOfferById = async (offerId: string): Promise<P2POffer | null> => {
  // TODO: Replace with actual API call
  const mockOffers: P2POffer[] = [
    {
      id: '1',
      advertiser: {
        id: 'user1',
        username: 'Mezon_Trader_Pro',
        avatar: 'https://ui-avatars.com/api/?name=Mezon+Trader&background=2563eb&color=fff',
        isVerified: true,
        isClanMember: false,
        totalOrders: 1203,
        completionRate: 99.5,
      },
      totalMZD: 20000,
      available: 5000,
      limit: {
        min: 100,
        max: 5000,
      },
      paymentMethods: ['TPBANK', 'MOMO'],
      isClanOffer: false,
      exchangeRate: 0.8,
    },
    {
      id: '2',
      advertiser: {
        id: 'user2',
        username: 'HaiNam_Dev',
        avatar: 'https://ui-avatars.com/api/?name=Hai+Nam&background=8b5cf6&color=fff',
        isVerified: false,
        isClanMember: true,
        totalOrders: 50,
        completionRate: 100,
      },
      totalMZD: 15000,
      available: 1000,
      limit: {
        min: 50,
        max: 2000,
      },
      paymentMethods: ['VIETCOMBANK'],
      isClanOffer: true,
      exchangeRate: 0.75,
    },
  ];

  return mockOffers.find((o) => o.id === offerId) || null;
};

export const useP2POffer = (offerId: string | null) => {
  const [offer, setOffer] = useState<P2POffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!offerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getOfferById(offerId).then((data) => {
      setOffer(data);
      setIsLoading(false);
    });
  }, [offerId]);

  return { offer, isLoading };
};

