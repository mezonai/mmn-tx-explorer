'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AllTransactionsTab, DetailsTab, ReceivedTransactionsTab, SentTransactionsTab } from './content-tabs';
import { useQueryParam } from '@/hooks';
import { IWalletDetails } from '@/modules/wallet/type';

interface WalletDetailTabsProps {
  walletDetails: IWalletDetails;
}

export const WalletDetailTabs = ({ walletDetails }: WalletDetailTabsProps) => {
  const { value: currentTab, handleChangeValue: handleChangeTab } = useQueryParam<string>({
    queryParam: 'tab',
    defaultValue: 'details',
    clearParams: ['page', 'limit'],
  });
  return (
    <Tabs value={currentTab} onValueChange={handleChangeTab} className="w-full gap-0">
      <div className="bg-background sticky top-0 z-10 mb-0 flex flex-col items-center justify-between gap-4 pt-6 pb-2 md:pt-8 lg:flex-row">
        <div className="w-full">
          {/* Desktop TabsList - hidden on mobile and tablet, visible on large screens */}
          <TabsList className="hidden w-full md:w-fit lg:flex">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="all-transactions">All transactions</TabsTrigger>
            <TabsTrigger value="sent-transactions">Sent transactions</TabsTrigger>
            <TabsTrigger value="received-transactions">Received transactions</TabsTrigger>
          </TabsList>

          {/* Mobile and tablet select - visible on small to medium screens, hidden on large screens */}
          <Select value={currentTab} onValueChange={handleChangeTab}>
            <SelectTrigger className="w-full lg:hidden">
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="details">Details</SelectItem>
              <SelectItem value="all-transactions">All transactions</SelectItem>
              <SelectItem value="sent-transactions">Sent transactions</SelectItem>
              <SelectItem value="received-transactions">Received transactions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Shared TabsContent for both desktop and mobile */}
      <TabsContent value="details">
        <DetailsTab walletDetails={walletDetails} />
      </TabsContent>
      <TabsContent value="all-transactions">
        <AllTransactionsTab walletAddress={walletDetails.address} />
      </TabsContent>
      <TabsContent value="sent-transactions">
        <SentTransactionsTab walletAddress={walletDetails.address} />
      </TabsContent>
      <TabsContent value="received-transactions">
        <ReceivedTransactionsTab walletAddress={walletDetails.address} />
      </TabsContent>
    </Tabs>
  );
};
