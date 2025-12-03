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
    totalMZD: 20000, // Tổng số MZD có sẵn
    available: 5000, // Còn khả dụng để bán
    limit: {
      min: 100, // Tối thiểu 100 MZD mỗi giao dịch
      max: 5000, // Tối đa 5000 MZD mỗi giao dịch
    },
    paymentMethods: ['TPBANK', 'MOMO'],
    isClanOffer: false,
    exchangeRate: 0.8, // 1 MZD = 0.8 VND
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
    available: 1000, // Còn khả dụng để bán
    limit: {
      min: 50, // Tối thiểu 50 MZD mỗi giao dịch
      max: 2000, // Tối đa 2000 MZD mỗi giao dịch
    },
    paymentMethods: ['VIETCOMBANK'],
    isClanOffer: true,
    exchangeRate: 0.75, // 1 MZD = 0.75 VND (ưu đãi clan)
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
    totalMZD: 30000,
    available: 3000, // Còn khả dụng để bán
    limit: {
      min: 200, // Tối thiểu 200 MZD mỗi giao dịch
      max: 10000, // Tối đa 10000 MZD mỗi giao dịch
    },
    paymentMethods: ['BANK_TRANSFER', 'MOMO', 'VIETCOMBANK'],
    isClanOffer: false,
    exchangeRate: 0.85, // 1 MZD = 0.85 VND
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
      // Lọc các offers có thể đáp ứng số lượng MZD muốn mua
      if (filters.amount) {
        filteredOffers = filteredOffers.filter(
          (offer) =>
            filters.amount! >= offer.limit.min &&
            filters.amount! <= offer.limit.max &&
            filters.amount! <= offer.available // Phải có đủ số lượng khả dụng
        );
      }

      setOffers(filteredOffers);
      setIsLoading(false);
    }, 500); // Simulate network delay
  }, [filters]);

  return { offers, isLoading };
};


