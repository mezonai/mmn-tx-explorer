'use client';

import { useP2POrder } from '../../hooks/useP2POrder';
import { useP2PChat } from '../../hooks/useP2PChat';
import { TradingRoomHeader } from './trading-room-header';
import { ProgressSteps } from './progress-steps';
import { OrderInfoCard } from './order-info-card';
import { BankInfoCard } from './bank-info-card';
import { PaymentActionButton } from './payment-action-button';
import { ChatSidebar } from './chat/chat-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface TradingRoomProps {
  orderId: string;
  currentUserId?: string; // TODO: Get from auth context
}

export const TradingRoom = ({ orderId, currentUserId = 'buyer1' }: TradingRoomProps) => {
  const { order, isLoading: orderLoading, updateOrderStatus } = useP2POrder(orderId);
  const { messages, isLoading: chatLoading, sendMessage } = useP2PChat(orderId);

  const handlePaymentConfirmed = () => {
    updateOrderStatus('PAYMENT_CONFIRMED');
    // TODO: Call API to update order status
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content, currentUserId, 'buyer');
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
          <PaymentActionButton order={order} onPaymentConfirmed={handlePaymentConfirmed} />
        </div>

        {/* Chat Sidebar (Right Side) */}
        <ChatSidebar
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          isLoading={chatLoading}
        />
      </div>
    </div>
  );
};




