'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { P2PHeader } from './p2p-header';
import { P2PFiltersComponent } from './p2p-filters';
import { P2POffersTable } from './p2p-offers-table';
import { P2POrdersList } from './p2p-orders-list';
import { CreateOfferModal } from './create-offer-modal';
import { P2POffer, CreateOfferFormData } from '../types/p2p.types';
import { useP2POffers } from '../hooks/useP2POffers';
import { useCreateOffer } from '../hooks/useCreateOffer';
import { P2P_QUERY_KEYS } from '../constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

export const P2P = () => {
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: offers, isLoading } = useP2POffers({ page: 0, limit: 10 });
  const { createOffer, isLoading: isCreatingOffer } = useCreateOffer();

  const handleNewOfferClick = () => {
    setIsCreateOfferModalOpen(true);
    setError(null);
  };

  const handleOfferClick = (offer: P2POffer) => {
    router.push(`/p2p/trading/${offer.offerId}?type=offer`);
  };

  const handleCreateOfferSubmit = async (data: CreateOfferFormData) => {
    try {
      setError(null);
      const newOffer = await createOffer(data);

      if (newOffer) {
        // Invalidate and refetch offers list
        await queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.OFFERS] });

        // Close modal
        setIsCreateOfferModalOpen(false);

        // Optional: Show success message or navigate
        console.log('✅ Offer created successfully:', newOffer);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo offer. Vui lòng thử lại.';
      setError(errorMessage);
      console.error('Error creating offer:', err);
    }
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
        onOpenChange={(open) => {
          setIsCreateOfferModalOpen(open);
          if (!open) setError(null);
        }}
        onSubmit={handleCreateOfferSubmit}
        isLoading={isCreatingOffer}
        error={error}
      />
    </div>
  );
};
