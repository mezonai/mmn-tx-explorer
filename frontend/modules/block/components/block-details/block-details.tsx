import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-navigation';
import { TabDetails, TabTransactions } from './shared';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { BlockService } from '../../api';

const breadcrumbs = [{ label: 'Blocks', href: '/blocks' }, { label: 'Block Details' }];

interface BlockDetailsProps {
  blockNumber: string;
}

export const BlockDetails = async ({ blockNumber }: BlockDetailsProps) => {
  const block = await BlockService.getBlockDetails(Number(blockNumber));
  return (
    <div>
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      <h1 className="text-primary-900 my-3 text-2xl font-semibold">Block Details</h1>
      <UrlSyncedTabs
        defaultValue="details"
        className="w-full space-y-4 md:space-y-6"
        listClassName="w-full md:w-fit [&>[data-slot='tabs-trigger']]:px-3 [&>[data-slot='tabs-trigger']]:py-2 mb-0"
        items={[
          { value: 'details', label: 'Details', content: <TabDetails blockDetails={block} /> },
          {
            value: 'transactions',
            label: 'Transactions',
            content: <TabTransactions blockNumber={Number(blockNumber)} />,
          },
        ]}
      />
    </div>
  );
};
