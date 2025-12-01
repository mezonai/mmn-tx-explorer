'use client';

import { useState } from 'react';
import { P2PHeader } from './p2p-header';
import { P2PFiltersComponent } from './p2p-filters';
import { P2POffersTable } from './p2p-offers-table';
import { CreateOfferModal } from './create-offer-modal';
import { P2PFilters, P2POffer, CreateOfferFormData } from '../types/p2p.types';
import { useP2POffers } from '../hooks/useP2POffers';

export const P2P = () => {
  const [filters, setFilters] = useState<P2PFilters>({
    tradeType: 'BUY',
    paymentMethod: 'ALL',
    friendsOnly: false,
    currency: 'MZD',
  });

  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);

  const { offers, isLoading } = useP2POffers(filters);

  const handleFiltersChange = (newFilters: P2PFilters) => {
    setFilters(newFilters);
  };

  const handleNewOfferClick = () => {
    setIsCreateOfferModalOpen(true);
  };

  const handleOfferClick = (offer: P2POffer) => {
    // TODO: Navigate to offer detail or open buy modal
    console.log('Offer clicked:', offer);
  };

  const handleCreateOfferSubmit = (data: CreateOfferFormData) => {
    // TODO: Call API to create offer
    console.log('Create offer:', data);
    // After successful creation, refresh offers list
  };

  return (
    <div className="w-full space-y-6">
      <P2PHeader />
      <P2PFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onNewOfferClick={handleNewOfferClick}
      />
      <P2POffersTable offers={offers} isLoading={isLoading} onOfferClick={handleOfferClick} />
      <CreateOfferModal
        open={isCreateOfferModalOpen}
        onOpenChange={setIsCreateOfferModalOpen}
        onSubmit={handleCreateOfferSubmit}
      />
    </div>
  );
};
