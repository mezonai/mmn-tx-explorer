import { BlockDetails } from '@/modules/block/components/block-details';
import { Metadata } from 'next';

interface TransactionDetailPageProps {
  params: Promise<{
    blockNumber: string;
  }>;
}

export async function generateMetadata({ params }: TransactionDetailPageProps): Promise<Metadata> {
  const { blockNumber } = await params;

  return {
    title: `Block ${blockNumber}`,
  };
}

export default async function BlockDetailsPage({ params }: TransactionDetailPageProps) {
  const { blockNumber } = await params;
  return <BlockDetails blockNumber={blockNumber} />;
}
