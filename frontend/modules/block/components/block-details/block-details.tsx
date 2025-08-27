'use client';

import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryParam } from '@/hooks';
import { TabsContent } from '@radix-ui/react-tabs';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BlockService } from '../../api';
import { IBlockDetails } from '../../types';
import { TabDetails, TabTransactions } from './shared';

const breadcrumbs = [{ label: 'Blocks', href: '/blocks' }, { label: 'Block Details' }];

export const BlockDetails = () => {
  const [blockDetails, setBlockDetails] = useState<IBlockDetails | null>(null);
  const { blockNumber } = useParams<{ blockNumber: string }>();
  const { value: currentTab, handleChangeValue: handleChangeTab } = useQueryParam<string>({
    queryParam: 'tab',
    defaultValue: 'details',
  });

  useEffect(() => {
    if (!blockNumber) return;

    const fetchBlockDetails = async () => {
      const blockDetails = await BlockService.getBlockDetails(blockNumber);
      setBlockDetails(blockDetails);
    };

    fetchBlockDetails();
  }, [blockNumber]);

  return (
    <div>
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      <h1 className="text-primary-900 my-3 text-2xl font-semibold">Block Details</h1>
      <Tabs value={currentTab} onValueChange={handleChangeTab} className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="details">
          <TabDetails block={blockDetails?.block} />
        </TabsContent>
        <TabsContent value="transactions">
          <TabTransactions transactions={blockDetails?.transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
