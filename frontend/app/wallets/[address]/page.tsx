import { Metadata } from 'next';

import { WalletDetails } from '@/modules/wallet/components';

interface WalletDetailPageProps {
  params: Promise<{
    address: string;
  }>;
}

export async function generateMetadata({ params }: WalletDetailPageProps): Promise<Metadata> {
  const { address } = await params;

  return {
    title: `Wallet ${address}`,
  };
}

export default async function WalletDetailPage({ params }: WalletDetailPageProps) {
  const { address } = await params;

  return <WalletDetails address={address} />;
}
