'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useP2POrder } from '../../hooks/useP2POrder';
import { useP2POffer } from '../../hooks/useP2POffer';
import { useCreateOrder } from '../../hooks/useCreateOrder';
import { useP2PChat } from '../../hooks/useP2PChat';
import { P2PService } from '../../api';
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
import { P2POrder } from '../../types/p2p.types';

interface TradingRoomProps {
  orderId: string;
  currentUserId?: string; // TODO: Get from auth context
}

export const TradingRoom = ({ orderId, currentUserId }: TradingRoomProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOfferMode = searchParams.get('type') === 'offer';

  const { order, isLoading: orderLoading, updateOrderStatus } = useP2POrder(isOfferMode ? '' : orderId);
  const offerIdParam = isOfferMode ? orderId : (order?.offerId ?? null);
  const { offer, isLoading: offerLoading } = useP2POffer(offerIdParam);
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();
  const { messages, isLoading: chatLoading, sendMessage } = useP2PChat(isOfferMode ? '' : orderId);

  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<P2POrder | null>(null); // Store created order locally

  // Use created order if available, otherwise use fetched order
  const currentOrder = createdOrder || order;

  // Detect user role (buyer or seller)
  const userRole = useMemo(() => {
    if (isOfferMode && !createdOrder) return 'buyer'; // In offer mode before order creation, user is always buyer
    if (!user?.walletAddress || !currentOrder) return null;
    if (currentOrder.buyerWalletAddress === user.walletAddress) return 'buyer';
    if (currentOrder.sellerWalletAddress === user.walletAddress) return 'seller';
    return null;
  }, [user?.walletAddress, currentOrder, isOfferMode, createdOrder]);

  const handleConfirmBuy = async (amountMZD: number, amountVND: number) => {
    if (!offer || !user?.walletAddress) {
      setError('Vui lòng đăng nhập để tiếp tục');
      return;
    }

    try {
      setError(null);
      const newOrder = await createOrder(offer, amountMZD, amountVND);

      if (newOrder) {
        // Store created order locally instead of navigating
        setCreatedOrder(newOrder);
        // Update chat to use new order ID
        // Note: useP2PChat will need to be updated to handle this
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
      console.error('Error creating order:', err);
    }
  };

  const handlePaymentConfirmed = async () => {
    const targetOrder = createdOrder || currentOrder;
    if (!targetOrder) return;

    try {
      setError(null);
      // Created order lives locally; update via service then sync local state
      if (createdOrder) {
        const updated = await P2PService.updateOrderStatus(targetOrder.orderId, 'WAIT_CONFIRM');
        setCreatedOrder(updated);
        return;
      }

      // Existing order fetched from API; delegate to hook (includes API call)
      await updateOrderStatus('WAIT_CONFIRM');
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.');
      console.error('Error updating order status:', err);
    }
  };

  const handleSellerConfirm = () => {
    updateOrderStatus('PAYMENT_CONFIRMED');
    // TODO: Call API to update order status
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
      orderId: '',
      offerId: offer?.offerId || '',
      buyerWalletAddress: user?.walletAddress || '',
      sellerWalletAddress: offer?.sellerWalletAddress || '',
      amountMZD: 0,
      amountVND: 0,
      exchangeRate: offer?.exchangeRate || 1,
      status: 'PAYMENT_PENDING' as const,
      createdAt: '',
      expiresAt: '',
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
                  ? `Đơn mua MZD #${createdOrder.orderId}`
                  : `Mua MZD từ ${formatWallet(offer?.sellerWalletAddress)}`}
              </h1>
              {!createdOrder && (
                <div className="text-xs text-gray-400">
                  Đang giao dịch với{' '}
                  <span className="text-brand-primary font-bold">{formatWallet(offer?.sellerWalletAddress)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content (Left Side) */}
          <div className="overflow-y-auto border-r border-gray-800 p-6 md:w-7/12 lg:w-8/12">
            <ProgressSteps order={displayOrder} />

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
                <BankInfoCard bankInfo={offer?.bankInfo} transferCode={offer?.transferCode} />
                {userRole === 'buyer' && (
                  <PaymentActionButton order={createdOrder} onPaymentConfirmed={handlePaymentConfirmed} />
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
            <h2 className="mb-2 text-xl font-bold text-white">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-400">Đơn hàng này không tồn tại hoặc đã bị xóa.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-screen flex-col">
      <TradingRoomHeader order={order} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (Left Side) */}
        <div className="overflow-y-auto border-r border-gray-800 p-6 md:w-7/12 lg:w-8/12">
          <ProgressSteps order={order} />
          <OrderInfoCard order={order} />
          {offer && <BankInfoCard bankInfo={offer.bankInfo} transferCode={offer.transferCode} />}

          {/* Conditional rendering based on user role */}
          {userRole === 'buyer' && <PaymentActionButton order={order} onPaymentConfirmed={handlePaymentConfirmed} />}
          {userRole === 'seller' && <SellerConfirmButton order={order} onConfirm={handleSellerConfirm} />}
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
