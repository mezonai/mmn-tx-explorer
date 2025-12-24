import type { Metadata } from 'next';

import { TradingRoom } from '@/modules/p2p/components/trading-room/trading-room';

export const metadata: Metadata = {
  title: 'P2P Trading Room',
};

interface TradingRoomPageProps {
  params: {
    orderId: string;
  };
}

export default function TradingRoomPage({ params }: TradingRoomPageProps) {
  // orderId can be either an order ID or an offer ID (when type=offer query param is present)
  // Use key prop to force re-mount when orderId changes (e.g., when navigating from offer to order)
  return <TradingRoom key={params.orderId} orderId={params.orderId} />;
}
