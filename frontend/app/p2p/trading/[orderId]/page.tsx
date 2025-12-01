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
  return <TradingRoom orderId={params.orderId} />;
}




