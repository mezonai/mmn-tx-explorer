'use client';

import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryParam } from '@/hooks';
import { TabsContent } from '@radix-ui/react-tabs';
import { useParams } from 'next/navigation';
import { TabDetails, TabTransactions } from './shared';

const breadcrumbs = [{ label: 'Blocks', href: '/blocks' }, { label: 'Block Details' }];

export const BlockDetails = () => {
  const { blockNumber } = useParams<{ blockNumber: string }>();
  const { value: currentTab, handleChangeValue: handleChangeTab } = useQueryParam<string>({
    queryParam: 'tab',
    defaultValue: 'details',
  });

  return (
    <div>
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      <h1 className="text-primary-900 my-3 text-2xl font-semibold">Block Details</h1>
      <Tabs value={currentTab} onValueChange={handleChangeTab} className="mt-5 space-y-3">
        <TabsList className="z-100 w-full sm:w-fit">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <TabDetails blockNumber={Number(blockNumber)} />
        </TabsContent>
        <TabsContent value="transactions">
          <TabTransactions blockNumber={Number(blockNumber)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
