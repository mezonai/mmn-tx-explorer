import Link from 'next/link';

import { AddressDisplay } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { IBlock } from '@/modules/block/types';
import { DateTimeUtil } from '@/utils';
import { TxnLink } from '../shared';

interface BlockCardProps {
  block: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  return (
    <div className="space-y-2 border-b pb-4 text-sm [&>*]:w-full [&>*]:gap-5">
      <div className="flex items-center justify-between">
        <Button variant="link" className="h-fit p-0 font-semibold" asChild>
          <Link href={ROUTES.BLOCK.replace(':id', block.block_number.toString())}>{block.block_number}</Link>
        </Button>
        <span className="text-muted-foreground">{DateTimeUtil.formatRelativeTime(block.block_timestamp * 1000)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Hash</span>
        <AddressDisplay address={block.block_hash} addressClassName="text-foreground" />
      </div>
      <div className="flex items-center justify-between">
        <span>Parent hash</span>
        <AddressDisplay address={block.parent_hash} addressClassName="text-foreground" />
      </div>
      <div className="flex items-center justify-between">
        <span>Validator</span>
        <AddressDisplay address={block.miner} />
      </div>
      <div className="flex items-center justify-between">
        <span>Txn</span>
        <TxnLink count={block.transaction_count} blockNumber={block.block_number} />
      </div>
    </div>
  );
};
