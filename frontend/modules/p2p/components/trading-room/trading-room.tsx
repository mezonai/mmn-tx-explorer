'use client';

import { useP2POrder } from '../../hooks/useP2POrder';
import { useP2PChat } from '../../hooks/useP2PChat';
import { useUser } from '@/providers/AppProvider';
import { TradingRoomHeader } from './trading-room-header';
import { ProgressSteps } from './progress-steps';
import { OrderInfoCard } from './order-info-card';
import { BankInfoCard } from './bank-info-card';
import { PaymentActionButton } from './payment-action-button';
import { SellerConfirmButton } from './seller-confirm-button';
import { ChatSidebar } from './chat/chat-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface TradingRoomProps {
  orderId: string;
  currentUserId?: string; // TODO: Get from auth context
}

export const TradingRoom = ({ orderId, currentUserId }: TradingRoomProps) => {
  const { user } = useUser();
  const { order, isLoading: orderLoading, updateOrderStatus } = useP2POrder(orderId);
  const { messages, isLoading: chatLoading, sendMessage } = useP2PChat(orderId);

  // Detect user role (buyer or seller)
  const userRole = useMemo(() => {
    if (!user?.id || !order) return null;
    if (order.buyerId === user.id) return 'buyer';
    if (order.sellerId === user.id) return 'seller';
    return null;
  }, [user?.id, order]);

  const handlePaymentConfirmed = () => {
    updateOrderStatus('WAIT_CONFIRM');
    // TODO: Call API to update order status
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

  if (orderLoading || !order) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-14 border-b border-gray-800 bg-card" />
        <div className="flex-1 p-6">
          <Skeleton className="h-20 w-full mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <TradingRoomHeader order={order} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (Left Side) */}
        <div className="w-full md:w-7/12 lg:w-8/12 p-6 overflow-y-auto border-r border-gray-800">
          <ProgressSteps order={order} />
          <OrderInfoCard order={order} />
          <BankInfoCard order={order} />
          
          {/* Conditional rendering based on user role */}
          {userRole === 'buyer' && (
            <PaymentActionButton order={order} onPaymentConfirmed={handlePaymentConfirmed} />
          )}
          {userRole === 'seller' && (
            <SellerConfirmButton order={order} onConfirm={handleSellerConfirm} />
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
};




