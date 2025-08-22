'use client';

import { PageBreadcrumb } from '@/components/shared/page-breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabsQueryParams } from '@/hooks/use-tabs-query-params';
import { Breadcrumb } from '@/types';
import { TabDetails } from './tab-details';
import { TabLogs } from './tab-logs';

const breadcrumbs: Breadcrumb[] = [
  { label: 'Transactions', href: '/transactions' },
  { label: 'Transaction Details', href: '#' },
];

export const TransactionDetails = () => {
  const { tab, handleTabChange } = useTabsQueryParams({ defaultTab: 'details' });

  return (
    <div>
      <PageBreadcrumb breadcrumbs={breadcrumbs} />
      <h1 className="text-primary-900 my-3 text-2xl font-semibold">Transaction Details</h1>
      <Tabs value={tab} onValueChange={handleTabChange} className="mt-5 space-y-3">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <TabDetails />
        </TabsContent>
        <TabsContent value="logs">
          <TabLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};
