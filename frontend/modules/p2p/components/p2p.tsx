'use client';

import { useState } from 'react';
import { P2PHeader } from './p2p-header';
import { P2PFiltersComponent } from './p2p-filters';
import { P2POffersTable } from './p2p-offers-table';
import { P2POrdersList } from './p2p-orders-list';
import { CreateOfferModal } from './create-offer-modal';
import { P2POffer, CreateOfferFormData } from '../types/p2p.types';
import { useP2POffers } from '../hooks/useP2POffers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const P2P = () => {
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);

  const { data: offers, isLoading } = useP2POffers({ page: 0, limit: 10 });

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
  };

  return (
    <div className="w-full space-y-6">
      <P2PHeader />

      <Tabs defaultValue="offers" className="w-full">
        <TabsList>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="my-offers">My Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-6">
          <P2PFiltersComponent onNewOfferClick={handleNewOfferClick} />
          <P2POffersTable offers={offers?.data} isLoading={isLoading} onOfferClick={handleOfferClick} />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <P2POrdersList />
        </TabsContent>
      </Tabs>

      <CreateOfferModal
        open={isCreateOfferModalOpen}
        onOpenChange={setIsCreateOfferModalOpen}
        onSubmit={handleCreateOfferSubmit}
      />
    </div>
  );
};
