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
      totalOrders: 1203,
      completionRate: 99.5,
    },
    totalMZD: 20000,
    available: 5000,
    limit: {
      min: 100,
      max: 5000,
    },
    exchangeRate: 0.8,
    bankInfo: {
      bank: 'TCB',
      accountNumber: '19034482991022',
      accountName: 'NGUYEN VAN A',
    },
  },
  {
    id: '2',
    advertiser: {
      id: 'user2',
      username: 'HaiNam_Dev',
      avatar: 'https://ui-avatars.com/api/?name=Hai+Nam&background=8b5cf6&color=fff',
      isVerified: false,
      totalOrders: 50,
      completionRate: 100,
    },
    totalMZD: 15000,
    available: 1000,
    limit: {
      min: 50,
      max: 2000,
    },
    exchangeRate: 0.75,
    bankInfo: {
      bank: 'VCB',
      accountNumber: '1234567890',
      accountName: 'TRAN VAN B',
    },
  },
  {
    id: '3',
    advertiser: {
      id: 'user3',
      username: 'CryptoMaster_VN',
      avatar: 'https://ui-avatars.com/api/?name=Crypto+Master&background=10b981&color=fff',
      isVerified: true,
      totalOrders: 856,
      completionRate: 98.2,
    },
    totalMZD: 30000,
    available: 3000,
    limit: {
      min: 200,
      max: 10000,
    },
    exchangeRate: 0.85,
    bankInfo: {
      bank: 'MB',
      accountNumber: '9876543210',
      accountName: 'LE VAN C',
    },
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
