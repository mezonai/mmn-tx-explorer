import { ItemAttribute } from '@/components/shared/item-attribute';
import { CopyButton } from '@/components/ui/copy-button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DATE_TIME_FORMAT } from '@/constant';
import { BlockService } from '@/modules/block/api';
import { DashboardService } from '@/modules/dashboard';
import { WalletThumb } from '@/modules/wallet/components/shared/wallet-thumb';
import { DateTimeUtil } from '@/utils';
import { Truncate } from '@re-dev/react-truncate';
import { format } from 'date-fns';
import { Clock4 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ButtonNavigateBlock } from '.';
import { IBlockDetails } from '../../../types';

interface TabDetailsProps {
  blockNumber: number;
}

export const TabDetails = ({ blockNumber }: TabDetailsProps) => {
  const [blockDetails, setBlockDetails] = useState<IBlockDetails | null>(null);
  const [hasNextBlock, setHasNextBlock] = useState(true);
  const block = blockDetails?.block;

  useEffect(() => {
    if (!blockNumber) return;

    const fetchBlockDetails = async () => {
      const [blockDetails, stats] = await Promise.all([
        BlockService.getBlockDetails(blockNumber),
        DashboardService.getStats(),
      ]);
      setBlockDetails(blockDetails);
      setHasNextBlock(blockNumber < stats.data.total_blocks - 1);
    };

    fetchBlockDetails();
  }, [blockNumber]);

  return (
    <div className="space-y-5">
      <ItemAttribute
        label="Block height"
        description="The height of the block"
        data={block}
        render={(block) => (
          <div className="flex items-center">
            <span>{block.block_number}</span>
            <div className="ml-2 flex items-center gap-2">
              {block.parent_hash && <ButtonNavigateBlock direction="previous" blockNumber={block.block_number - 1} />}
              {hasNextBlock && <ButtonNavigateBlock direction="next" blockNumber={block.block_number + 1} />}
            </div>
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-30" />}
      />
      <ItemAttribute
        label="Block size"
        description="The size of the block"
        data={block}
        render={(block) => (
          <div>
            <span>{block.size}</span>
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-15" />}
      />
      <ItemAttribute
        label="Transactions count"
        description="The number of transactions in the block"
        data={block}
        render={(block) => (
          <div>
            <span>{block.transaction_count}</span>
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-15" />}
      />
      <ItemAttribute
        label="Validated by"
        description="The validator that validated the block"
        data={block}
        render={(block) => (
          <div className="flex items-center">
            <WalletThumb />
            <div className="mr-2 flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{block.miner}</Truncate>
              <span className="hidden md:block">{block.miner}</span>
            </div>
            <CopyButton textToCopy={block.miner} />
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-full md:w-150" />}
      />
      <ItemAttribute
        label="Block timestamp"
        description="The timestamp of the block"
        data={block}
        render={(block) => (
          <div className="flex items-center space-x-2">
            <Clock4 className="text-foreground-quaternary-400 size-4" />
            <span>{DateTimeUtil.formatRelativeTimeSec(block.block_timestamp)}</span>
            <span>|</span>
            <span>
              {format(DateTimeUtil.toMilliseconds(block.block_timestamp), DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}
            </span>
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-[50%]" />}
      />
      <Separator />
      <ItemAttribute
        label="Block hash"
        description="The hash of the block"
        data={block}
        render={(block) => (
          <div className="flex items-center gap-2">
            <div className="flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{block.block_hash}</Truncate>
              <span className="hidden md:block">{block.block_hash}</span>
            </div>
            <CopyButton textToCopy={block.block_hash} />
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-full md:w-150" />}
      />
      <ItemAttribute
        label="Block parent hash"
        description="The hash of the parent block"
        data={block}
        render={(block) => (
          <div className="flex items-center gap-2">
            <Link href={`/blocks/${block.block_number - 1}`} className="text-primary flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{block.parent_hash}</Truncate>
              <span className="hidden md:block">{block.parent_hash}</span>
            </Link>
            <CopyButton textToCopy={block.parent_hash} />
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-full md:w-150" />}
      />
    </div>
  );
};
