import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-navigation';
import { TabDetails, TabTransactions } from './shared';
import { BlockService } from '../../api';

const breadcrumbs = [{ label: 'Blocks', href: '/blocks' }, { label: 'Block Details' }];

interface BlockDetailsProps {
  blockNumber: string;
}

export const BlockDetails = async ({ blockNumber }: BlockDetailsProps) => {
  const block = await BlockService.getBlockDetails(Number(blockNumber));
  return (
    <div className='flex flex-col gap-2'>
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      <div className='my-2'>
      <h1 className="text-primary-900 my-3 text-2xl font-semibold">Block Details</h1>
      <TabDetails blockDetails={block} />
      </div>

      <div className='my-2'>
        <h1 className="text-primary-900 my-3 text-2xl font-semibold">Transactions in this Block</h1>
        <TabTransactions blockNumber={Number(blockNumber)} />
      </div>
    </div>
  );
};
