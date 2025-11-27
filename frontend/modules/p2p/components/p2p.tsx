'use client';

import { useState } from 'react';
import { P2PHeader } from './p2p-header';
import { P2PFiltersComponent } from './p2p-filters';
import { P2POffersTable } from './p2p-offers-table';
import { P2PFilters, P2POffer } from '../types/p2p.types';
import { useP2POffers } from '../hooks/useP2POffers';

export const P2P = () => {
  const [filters, setFilters] = useState<P2PFilters>({
    tradeType: 'BUY',
    paymentMethod: 'ALL',
    friendsOnly: false,
    currency: 'MZD',
  });

  const { offers, isLoading } = useP2POffers(filters);

  const handleFiltersChange = (newFilters: P2PFilters) => {
    setFilters(newFilters);
  };

  const handleNewOfferClick = () => {
    // TODO: Navigate to create offer page or open modal
    console.log('New offer clicked');
  };

  const handleOfferClick = (offer: P2POffer) => {
    // TODO: Navigate to offer detail or open buy modal
    console.log('Offer clicked:', offer);
  };

  return (
    <div className="w-full space-y-6">
      <P2PHeader />
      <P2PFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} onNewOfferClick={handleNewOfferClick} />
      <P2POffersTable offers={offers} isLoading={isLoading} onOfferClick={handleOfferClick} />
    </div>
  );
};
