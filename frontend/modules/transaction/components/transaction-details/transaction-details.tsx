import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-navigation';
import { IBreadcrumb } from '@/types';
import { TransactionService } from '../../api';
import { TabDetails } from './shared';

interface TransactionDetailsProps {
  transactionHash: string;
  isPending?: boolean;
}

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Transactions', href: '/transactions' },
  { label: 'Transaction Details', href: '#' },
] as const;

export const TransactionDetails = async ({ transactionHash, isPending = false }: TransactionDetailsProps) => {
  const transaction = isPending
    ? await TransactionService.getPendingTransactionDetails(transactionHash)
    : await TransactionService.getTransactionDetails(transactionHash);
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
        <h1 className="text-2xl font-semibold">Transaction Details</h1>
      </div>
      <TabDetails transaction={transaction} />
    </div>
  );
};
