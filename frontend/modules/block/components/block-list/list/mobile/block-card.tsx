import { IBlock } from '@/modules/block/types';
import {
  BlockNumberField,
  BlockNumberFieldSkeleton,
  HashField,
  HashFieldSkeleton,
  TxnLink,
  TxnLinkSkeleton,
} from '../shared';

interface BlockCardProps {
  block?: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  return (
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
      <div className="flex items-center justify-between">
        <span>Hash</span>
        {block ? (
          <HashField hash={block.block_hash} className="w-40" addressClassName="text-foreground" />
        ) : (
          <HashFieldSkeleton className="w-40" />
        )}
      </div>
      {/* <div className="flex items-center justify-between">
        <span>Parent hash</span>
        {block ? (
          <HashField hash={block.parent_hash} className="w-40" addressClassName="text-foreground" />
        ) : (
          <HashFieldSkeleton className="w-40" />
        )}
      </div> */}
      {/* <div className="flex items-center justify-between">
        <span>Validator</span>
        {block ? (
          <HashField hash={block.miner} className="w-40" addressClassName="text-foreground" />
        ) : (
          <HashFieldSkeleton className="w-40" />
        )}
      </div> */}
      <div className="flex items-center justify-between">
        <span>Txn</span>
        {block ? <TxnLink count={block.transaction_count} blockNumber={block.block_number} /> : <TxnLinkSkeleton />}
      </div>
    </div>
  );
};
