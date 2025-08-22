'use client';

import { PageBreadcrumb } from '@/components/shared/page-breadcrumb';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabsQueryParams } from '@/hooks/use-tabs-query-params';
import { TabsContent } from '@radix-ui/react-tabs';
import { TabDetails } from './tab-details';
import { TabTransactions } from './tab-transactions';
import { TablePagination } from '@/components/ui/table-pagination';

const breadcrumbs = [{ label: 'Blocks', href: '/blocks' }, { label: 'Block Details' }];

export const BlockDetails = () => {
  const { tab, handleTabChange } = useTabsQueryParams({ defaultTab: 'details' });

  return (
    <div>
      <PageBreadcrumb breadcrumbs={breadcrumbs} />
      <h1 className="text-primary-900 my-3 text-2xl font-semibold">Block Details</h1>
      <Tabs value={tab} onValueChange={handleTabChange} className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          {tab === 'transactions' && <TablePagination page={1} onPageChange={() => {}} disabled={false} />}
        </div>
        <TabsContent value="details">
          <TabDetails />
        </TabsContent>
        <TabsContent value="transactions">
          <TabTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
};
