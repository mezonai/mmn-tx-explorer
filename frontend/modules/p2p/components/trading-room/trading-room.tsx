'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useP2POrder } from '../../hooks/useP2POrder';
import { useP2POffer } from '../../hooks/useP2POffer';
import { useCreateOrder } from '../../hooks/useCreateOrder';
import { useP2PChat } from '../../hooks/useP2PChat';
import { useUser } from '@/providers/AppProvider';
import { TradingRoomHeader } from './trading-room-header';
import { ProgressSteps } from './progress-steps';
import { OrderInfoCard } from './order-info-card';
import { BankInfoCard } from './bank-info-card';
import { PaymentActionButton } from './payment-action-button';
import { SellerConfirmButton } from './seller-confirm-button';
import { BuyAmountSection } from './buy-amount-section';
import { ChatSidebar } from './chat/chat-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { P2POrder } from '../../types';
import { toast } from 'sonner';

interface TradingRoomProps {
  orderId: string;
  currentUserId?: string; // TODO: Get from auth context
}

export const TradingRoom = ({ orderId, currentUserId }: TradingRoomProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOfferMode = searchParams.get('type') === 'offer';

  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<P2POrder | null>(null); // Store created order locally
  const [localStatus, setLocalStatus] = useState<string | null>(null); // Local override for order status (buyer optimistic UI)

  const { order, isLoading: orderLoading, updateOrderStatus } = useP2POrder(isOfferMode ? '' : orderId);
  const offerIdParam = isOfferMode ? orderId : order ? String(order.offer_id) : null;
  const { offer, isLoading: offerLoading } = useP2POffer(offerIdParam);
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();
  const orderIdForChat = createdOrder ? String(createdOrder.order_id) : isOfferMode ? '' : orderId;
  const { messages, isLoading: chatLoading, sendMessage } = useP2PChat(orderIdForChat);

  // Sync createdOrder with order from useP2POrder when order updates via WebSocket
  useEffect(() => {
    if (createdOrder && order && String(createdOrder.order_id) === String(order.order_id)) {
      if (order.status !== createdOrder.status) {
        setCreatedOrder(order);
      }
    }
  }, [order, createdOrder]);

  // Use created order if available, otherwise use fetched order
  const currentOrder = createdOrder || order;

  // Detect user role (buyer or seller)
  const userRole = useMemo(() => {
    if (isOfferMode && !createdOrder) return 'buyer'; // In offer mode before order creation, user is always buyer
    if (!user?.walletAddress || !currentOrder) return null;

    // Buyer check
    if (currentOrder.buyer_wallet_address === user.walletAddress) return 'buyer';

    // Seller check (prefer explicit seller wallet from order or offer)
    const sellerWallet = currentOrder.seller_wallet_address || offer?.seller_wallet_address;
    if (sellerWallet && sellerWallet === user.walletAddress) return 'seller';

    // Fallback: if not buyer, assume seller (for cases seller_wallet_address missing in payload)
    return 'seller';
  }, [user?.walletAddress, currentOrder, isOfferMode, createdOrder, offer]);

  // Reset localStatus when canonical order status changes (e.g., via WebSocket)
  useEffect(() => {
    if (order?.status) {
      setLocalStatus(null);
    }
  }, [order?.status]);

  const handleConfirmBuy = async (amountMZD: number, amountVND: number) => {
    if (!offer || !user?.walletAddress) {
      setError('Please sign in to continue.');
      return;
    }

    try {
      setError(null);
      const newOrder = await createOrder(offer, amountMZD, amountVND);

      if (newOrder) {
        setCreatedOrder(newOrder);
      }
    } catch (err) {
      toast.error('Failed to create order', {
        description: 'Please try again later',
      });
      setError('Something went wrong while creating the order. Please try again.');
    }
  };

  // Buyer status update now handled inside PaymentActionButton

  const handleSellerConfirm = async () => {
    try {
      await updateOrderStatus('CONFIRMED');
    } catch (err) {
      setError('Something went wrong while updating status. Please try again.');
      console.error('Error updating order status:', err);
    }
  };

  const handleSendMessage = (content: string) => {
    const userId = user?.id || currentUserId || 'user1';
    const senderType = userRole === 'buyer' ? 'buyer' : 'seller';
    sendMessage(content, userId, senderType);
  };

  // Loading state
  if ((isOfferMode && offerLoading && !createdOrder) || (!isOfferMode && (orderLoading || !order) && !createdOrder)) {
    return (
      <div className="flex h-screen flex-col">
        <div className="bg-card h-14 border-b border-gray-800" />
        <div className="flex-1 p-6">
          <Skeleton className="mb-6 h-20 w-full" />
          <Skeleton className="mb-6 h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Offer mode or order created from offer - Show unified trading room
  if ((isOfferMode && offer) || createdOrder) {
    const displayOrder = createdOrder || {
      order_id: '',
      offer_id: offer?.offer_id || '',
      buyer_wallet_address: user?.walletAddress || '',
      amount: 0,
      price: 0,
      payable_amount: 0,
      status: 'OPEN' as const,
      transfer_code: null,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const formatWallet = (address?: string) =>
      (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A') as string;

    return (
      <div className="bg-background flex h-screen flex-col">
        <div className="bg-card flex h-14 shrink-0 items-center justify-between border-b border-gray-800 px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 transition hover:text-white"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white">
                {createdOrder
                  ? `MZD buy order #${createdOrder.order_id}`
                  : `Buy MZD from ${formatWallet(offer?.seller_wallet_address)}`}
              </h1>
              {!createdOrder && (
                <div className="text-xs text-gray-400">
                  Trading with{' '}
                  <span className="text-brand-primary font-bold">{formatWallet(offer?.seller_wallet_address)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content (Left Side) */}
          <div className="overflow-y-auto border-r border-gray-800 p-6 md:w-7/12 lg:w-8/12">
            <ProgressSteps order={displayOrder} />

            {userRole === 'buyer' && displayOrder.status === 'PENDING' && (
              <p className="mb-4 text-sm text-gray-400">Waiting for the seller to confirm</p>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Show BuyAmountSection if order not created yet */}
            {!createdOrder && offer && (
              <BuyAmountSection offer={offer} onConfirmBuy={handleConfirmBuy} isLoading={isCreatingOrder} />
            )}

            {/* Show OrderInfoCard, BankInfoCard, and PaymentActionButton if order is created */}
            {createdOrder && (
              <>
                <OrderInfoCard order={createdOrder} />
                <BankInfoCard bank_info={offer?.bank_info} transfer_code={offer?.transfer_code} />
                {userRole === 'buyer' && (
                  <PaymentActionButton
                    order={createdOrder}
                    nextStatus="PENDING"
                    onStatusUpdated={(updated) => setCreatedOrder(updated)}
                  />
                )}
              </>
            )}
          </div>

          {/* Chat Sidebar (Right Side) */}
          <ChatSidebar
            messages={messages}
            currentUserId={user?.id || currentUserId || ''}
            onSendMessage={handleSendMessage}
            isLoading={chatLoading}
          />
        </div>
      </div>
    );
  }

  // Order mode - Show normal trading room
  if (!order) {
    return (
      <div className="flex h-screen flex-col">
        <div className="bg-card h-14 border-b border-gray-800" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-bold text-white">Order not found</h2>
            <p className="text-gray-400">This order does not exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  // Apply local status override for normal order mode (buyer optimistic UI)
  const effectiveOrder: P2POrder = localStatus ? { ...order, status: localStatus } : order;

  return (
    <div className="bg-background flex h-screen flex-col">
      <TradingRoomHeader order={effectiveOrder} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (Left Side) */}
        <div className="overflow-y-auto border-r border-gray-800 p-6 md:w-7/12 lg:w-8/12">
          <ProgressSteps order={effectiveOrder} />

          {userRole === 'buyer' && effectiveOrder.status === 'PENDING' && (
            <p className="mb-4 text-sm text-gray-400">Waiting for the seller to confirm</p>
          )}

          <OrderInfoCard order={effectiveOrder} />
          {offer && <BankInfoCard bank_info={offer.bank_info} transfer_code={offer.transfer_code} />}

          {/* Conditional rendering based on user role */}
          {userRole === 'buyer' && (
            <PaymentActionButton
              order={order}
              nextStatus="PENDING"
              onStatusUpdated={(updated) => setLocalStatus(String(updated.status))}
            />
          )}
          {userRole === 'seller' && <SellerConfirmButton order={effectiveOrder} onConfirm={handleSellerConfirm} />}
        </div>

        {/* Chat Sidebar (Right Side) */}
        <ChatSidebar
          messages={messages}
          currentUserId={user?.id || currentUserId || ''}
          onSendMessage={handleSendMessage}
          isLoading={chatLoading}
        />
      </div>
    </div>
  );
};
