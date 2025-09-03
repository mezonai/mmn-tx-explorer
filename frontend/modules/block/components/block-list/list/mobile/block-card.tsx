import { IBlock } from '@/modules/block/types';
import {
  BlockNumberField,
  BlockNumberFieldSkeleton,
  HashField,
  HashFieldSkeleton,
  TxnLink,
  TxnLinkSkeleton,
  ValidatorField,
  ValidatorFieldSkeleton,
} from '../shared';

interface BlockCardProps {
  block?: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  return (
    <div className="text-secondary-700 space-y-2 border-b pb-4 text-sm font-medium [&>*]:w-full [&>*]:gap-5">
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
      <div className="flex items-center justify-between">
        <span>Hash</span>
        {block ? (
          <HashField hash={block.block_hash} className="w-40" addressClassName="text-foreground" />
        ) : (
          <HashFieldSkeleton className="w-40" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span>Parent hash</span>
        {block ? (
          <HashField hash={block.parent_hash} className="w-40" addressClassName="text-foreground" />
        ) : (
          <HashFieldSkeleton className="w-40" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span>Validator</span>
        {block ? (
          <ValidatorField miner={block.miner} className="w-40" addressClassName="font-normal" />
        ) : (
          <ValidatorFieldSkeleton className="w-40" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span>Txn</span>
        {block ? <TxnLink count={block.transaction_count} blockNumber={block.block_number} /> : <TxnLinkSkeleton />}
      </div>
    </div>
  );
};
