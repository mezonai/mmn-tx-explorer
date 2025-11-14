import { IBlock } from '@/modules/block/types';
import {
  BlockNumberField,
  BlockNumberFieldSkeleton,
  HashField,
  HashFieldSkeleton,
  TxnLink,
  TxnLinkSkeleton,
} from '../shared';
import { Card, CardContent } from '@/components/ui/card';

interface BlockCardProps {
  block?: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  return (
    <Card className="bg-card dark:border-primary/15 w-full p-0">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="text-foreground space-y-2 border-b py-2 text-sm font-medium [&>*]:w-full [&>*]:gap-5">
          {block ? (
            <BlockNumberField
              blockNumber={block.block_number}
              blockTimestamp={block.block_timestamp}
              showAbsoluteTime={false}
              className="flex-row items-center justify-between"
            />
          ) : (
            <BlockNumberFieldSkeleton className="flex-row items-center justify-between [&>*]:h-5" />
          )}
        </div>
        <div className="flex items-center justify-between">
          <span>Hash</span>
          {block ? (
            <HashField hash={block.block_hash} className="w-40" addressClassName="text-foreground" />
          ) : (
            <HashFieldSkeleton className="w-40" />
          )}
        </div>
        <div className="flex items-center justify-between">
          <span>Txn</span>
          {block ? <TxnLink count={block.transaction_count} blockNumber={block.block_number} /> : <TxnLinkSkeleton />}
        </div>
      </CardContent>
    </Card>
  );
};
