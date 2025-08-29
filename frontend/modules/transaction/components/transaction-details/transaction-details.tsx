'use client';

import { useEffect, useState } from 'react';

import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryParam } from '@/hooks';
import { IBreadcrumb } from '@/types';
import { TransactionService } from '../../api';
import { ITransaction } from '../../types';
import { TabDetails, TabLogs } from './shared';

interface TransactionDetailsProps {
  transactionHash: string;
}

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Transactions', href: '/transactions' },
  { label: 'Transaction Details', href: '#' },
] as const;

export const TransactionDetails = ({ transactionHash }: TransactionDetailsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [transaction, setTransaction] = useState<ITransaction>();
  const { value: currentTab, handleChangeValue: handleChangeTab } = useQueryParam<string>({
    queryParam: 'tab',
    defaultValue: 'details',
  });

  const handleFetchTransaction = async (transactionHash: string) => {
    try {
      setIsLoading(true);
      const transaction = await TransactionService.getTransactionDetails(transactionHash);
      setTransaction(transaction);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!transactionHash) return;
    handleFetchTransaction(transactionHash);
  }, [transactionHash]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
        <h1 className="text-2xl font-semibold">Transaction Details</h1>
      </div>

      <Tabs value={currentTab} onValueChange={handleChangeTab} className="w-full space-y-4 md:space-y-6">
        <TabsList className="w-full md:w-fit [&>[data-slot='tabs-trigger']]:px-3 [&>[data-slot='tabs-trigger']]:py-2">
          <TabsTrigger value="details" disabled={isLoading}>
            Details
          </TabsTrigger>
          <TabsTrigger value="logs" disabled={isLoading}>
            Logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <TabDetails transaction={transaction} />
        </TabsContent>
        <TabsContent value="logs">
          <TabLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};
