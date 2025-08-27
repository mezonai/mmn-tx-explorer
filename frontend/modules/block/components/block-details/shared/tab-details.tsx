import { ItemAttribute } from '@/components/shared/item-attribute';
import { ValidatorThumb } from '@/components/shared/validator-thumb';
import { CopyButton } from '@/components/ui/copy-button';
import { Separator } from '@/components/ui/separator';
import { DATE_TIME_FORMAT } from '@/constant';
import { DateTimeUtil } from '@/utils';
import { Truncate } from '@re-dev/react-truncate';
import { format } from 'date-fns';
import { Clock4 } from 'lucide-react';
import Link from 'next/link';
import { ButtonNavigateBlock } from '.';
import { IBlock } from '../../../types';

interface TabDetailsProps {
  block?: IBlock;
}

export const TabDetails = ({ block }: TabDetailsProps) => {
  if (!block) return <></>;

  return (
    <div className="space-y-5">
      <ItemAttribute
        label="Block height"
        description="The height of the block"
        render={
          <div className="flex items-center">
            <span>{block.block_number}</span>
            <div className="ml-2 flex items-center gap-2">
              <ButtonNavigateBlock direction="previous" blockNumber={block.block_number - 1} />
              <ButtonNavigateBlock direction="next" blockNumber={block.block_number + 1} />
            </div>
          </div>
        }
      />
      <ItemAttribute
        label="Block size"
        description="The size of the block"
        render={
          <div>
            <span>{block.size}</span>
          </div>
        }
      />
      <ItemAttribute
        label="Transactions count"
        description="The number of transactions in the block"
        render={
          <div>
            <span>{block.transaction_count}</span>
          </div>
        }
      />
      <ItemAttribute
        label="Validated by"
        description="The validator that validated the block"
        render={
          <div className="flex items-center">
            <ValidatorThumb />
            <div className="text-primary flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{block.miner}</Truncate>
              <span className="hidden md:inline-block">{block.miner}</span>
            </div>
            <CopyButton textToCopy={block.miner} />
          </div>
        }
      />
      <ItemAttribute
        label="Block timestamp"
        description="The timestamp of the block"
        render={
          <div className="flex items-center space-x-2">
            <Clock4 className="text-foreground-quaternary-400 size-4" />
            <span>{DateTimeUtil.formatRelativeTime(new Date(block.block_timestamp * 1000))}</span>
            <span>|</span>
            <span>{format(new Date(block.block_timestamp * 1000), DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}</span>
          </div>
        }
      />
      <Separator />
      <ItemAttribute
        label="Block hash"
        description="The hash of the block"
        render={
          <div className="flex items-center">
            <div className="flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{block.block_hash}</Truncate>
              <span className="hidden md:inline-block">{block.block_hash}</span>
            </div>
            <CopyButton textToCopy={block.block_hash} />
          </div>
        }
      />
      <ItemAttribute
        label="Block parent hash"
        description="The hash of the parent block"
        render={
          <div className="flex items-center">
            <Link href={`/blocks/${block.block_number - 1}`} className="text-primary flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{block.parent_hash}</Truncate>
              <span className="hidden md:inline-block">{block.parent_hash}</span>
            </Link>
            <CopyButton textToCopy={block.parent_hash} />
          </div>
        }
      />
    </div>
  );
};
