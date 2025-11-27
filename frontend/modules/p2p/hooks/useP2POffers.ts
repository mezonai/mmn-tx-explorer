import { useState, useEffect } from 'react';
import { P2POffer, P2PFilters } from '../types/p2p.types';

// Mock data - sẽ thay thế bằng API call sau
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
    price: 25450,
    available: 5000,
    limit: {
      min: 150000,
      max: 50000000,
    },
    paymentMethods: ['TPBANK', 'MOMO'],
    isClanOffer: false,
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
    price: 25400,
    available: 1000,
    limit: {
      min: 100000,
      max: 2000000,
    },
    paymentMethods: ['VIETCOMBANK'],
    isClanOffer: true,
    clanDiscount: 0.2, // 0.2% discount
  },
  {
    id: '3',
    advertiser: {
      id: 'user3',
      username: 'CryptoMaster_VN',
      avatar: 'https://ui-avatars.com/api/?name=Crypto+Master&background=10b981&color=fff',
      isVerified: true,
      isClanMember: false,
      totalOrders: 856,
      completionRate: 98.2,
    },
    price: 25500,
    available: 3000,
    limit: {
      min: 500000,
      max: 10000000,
    },
    paymentMethods: ['BANK_TRANSFER', 'MOMO', 'VIETCOMBANK'],
    isClanOffer: false,
  },
];

export const useP2POffers = (filters: P2PFilters) => {
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let filteredOffers = [...mockOffers];

      // Filter by trade type (for now, we only show BUY offers)
      // In real implementation, this would filter based on offer type

      // Filter by payment method
      if (filters.paymentMethod !== 'ALL') {
        filteredOffers = filteredOffers.filter((offer) =>
          offer.paymentMethods.includes(filters.paymentMethod)
        );
      }

      // Filter by friends/clan only
      if (filters.friendsOnly) {
        filteredOffers = filteredOffers.filter((offer) => offer.advertiser.isClanMember);
      }

      // Filter by amount range (if amount is specified)
      if (filters.amount) {
        filteredOffers = filteredOffers.filter(
          (offer) => filters.amount! >= offer.limit.min && filters.amount! <= offer.limit.max
        );
      }

      setOffers(filteredOffers);
      setIsLoading(false);
    }, 500); // Simulate network delay
  }, [filters]);

  return { offers, isLoading };
};

