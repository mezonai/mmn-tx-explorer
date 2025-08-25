import { Metadata } from 'next';

import { TransactionDetails } from '@/modules/transaction/components';

interface TransactionDetailPageProps {
  params: Promise<{
    transactionHash: string;
  }>;
}

export async function generateMetadata({ params }: TransactionDetailPageProps): Promise<Metadata> {
  const { transactionHash } = await params;

  return {
    title: `Transaction ${transactionHash}`,
  };
}

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { transactionHash } = await params;

  return <TransactionDetails transactionHash={transactionHash} />;
}
