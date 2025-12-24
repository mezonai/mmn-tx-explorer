import type { Metadata } from 'next';

import { TradingRoom } from '@/modules/p2p/components/trading-room/trading-room';

export const metadata: Metadata = {
  title: 'P2P Trading Room',
};

interface TradingRoomPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function TradingRoomPage({ params }: TradingRoomPageProps) {
  const { orderId } = await params;
  return <TradingRoom orderId={orderId} />;
}
