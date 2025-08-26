import { ItemAttribute } from '@/components/shared/item-attribute';
import { ValidatorThumb } from '@/components/shared/validator-thumb';
import { CopyButton } from '@/components/ui/copy-button';
import { EllipsisText } from '@/components/ui/ellipsis-text';
import { Separator } from '@/components/ui/separator';
import { DATE_TIME_FORMAT } from '@/constant';
import { DateTimeUtil } from '@/utils';
import { format } from 'date-fns';
import { Clock4 } from 'lucide-react';
import Link from 'next/link';
import { ButtonNavigateBlock } from '.';
import { IBlockDetails } from '../../../types';

export const TabDetails = ({ blockDetails }: { blockDetails: IBlockDetails }) => {
  console.log('blockDetails', blockDetails);
  return (
    <div className="space-y-5">
      <ItemAttribute
        label="Block height"
        description="The height of the block"
        render={
          <div className="flex items-center">
            <span>{blockDetails.block.block_number}</span>
            <div className="ml-2 flex items-center gap-2">
              <ButtonNavigateBlock direction="previous" blockNumber={blockDetails.block.block_number - 1} />
              <ButtonNavigateBlock direction="next" blockNumber={blockDetails.block.block_number + 1} />
            </div>
          </div>
        }
      />
      <ItemAttribute
        label="Block size"
        description="The size of the block"
        render={
          <div>
            <span>{blockDetails.block.size}</span>
          </div>
        }
      />
      <ItemAttribute
        label="Transactions count"
        description="The number of transactions in the block"
        render={
          <div>
            <span>{blockDetails.block.transaction_count}</span>
          </div>
        }
      />
      <ItemAttribute
        label="Validated by"
        description="The validator that validated the block"
        render={
          <div className="flex items-center">
            <ValidatorThumb />
            <EllipsisText className="text-brand-secondary-700 ml-2">{blockDetails.block.miner}</EllipsisText>
            <CopyButton textToCopy={blockDetails.block.miner} />
          </div>
        }
      />
      <ItemAttribute
        label="Block timestamp"
        description="The timestamp of the block"
        render={
          <div className="flex items-center space-x-2">
            <Clock4 className="text-foreground-quaternary-400 size-4" />
            <span>{DateTimeUtil.formatRelativeTime(new Date(blockDetails.block.block_timestamp))}</span>
            <span>|</span>
            <span>
              {format(new Date(blockDetails.block.block_timestamp), DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}
            </span>
          </div>
        }
      />
      <Separator />
      <ItemAttribute
        label="Block hash"
        description="The hash of the block"
        render={
          <div className="flex items-center">
            <EllipsisText className="text-brand-secondary-700">{blockDetails.block.block_hash}</EllipsisText>
            <CopyButton textToCopy={blockDetails.block.block_hash} />
          </div>
        }
      />
      <ItemAttribute
        label="Block parent hash"
        description="The hash of the parent block"
        render={
          <div className="flex items-center">
            <Link href="/blocks/1234567890" className="w-full flex-1">
              <EllipsisText className="text-brand-secondary-700">{blockDetails.block.parent_hash}</EllipsisText>
            </Link>
            <CopyButton textToCopy={blockDetails.block.parent_hash} />
          </div>
        }
      />
    </div>
  );
};
