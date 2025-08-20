import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { IBlock } from '@/modules/block/types';
import { formatRelativeTime } from '@/modules/transaction';
import { GasUsage, TxnLink, ValidatorAddress } from '../shared';

interface BlockCardProps {
  block: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  return (
    <div className="space-y-2 border-b pb-4 text-sm [&>*]:w-full">
      <div className="flex items-center justify-between">
        <Button variant="link" className="h-fit p-0 font-semibold" asChild>
          <Link href={ROUTES.BLOCK.replace(':id', block.block_number.toString())}>{block.block_number}</Link>
        </Button>
        <span className="text-muted-foreground">
          {formatRelativeTime(new Date(block.block_timestamp * 1000).toISOString())}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span>Size</span>
        <span>{block.size} bytes</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Validator</span>
        <ValidatorAddress address={block.miner} />
      </div>
      <div className="flex items-center justify-between">
        <span>Txn</span>
        <TxnLink count={block.transaction_count} blockNumber={block.block_number} />
      </div>
      <div className="flex items-center justify-between">
        <span>Gas used</span>
        <GasUsage gasUsed={block.gas_used} gasLimit={block.gas_limit} className="flex items-center gap-2 space-y-0" />
      </div>
      <div className="flex items-center justify-between">
        <span>Burnt fees</span>
        <span>0</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Base fee</span>
        <span>{block.base_fee_per_gas}</span>
      </div>
    </div>
  );
};
