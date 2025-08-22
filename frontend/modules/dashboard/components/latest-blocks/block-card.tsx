import Link from 'next/link';

import { MiddleTruncate } from '@re-dev/react-truncate';

import { Cube01 } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/configs/routes.config';
import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { IBlock } from '@/modules/block';

interface BlockCardProps {
  block: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  const getTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = now - timestamp;

    if (timeDiff < 60) {
      return `${timeDiff}s ago`;
    } else if (timeDiff < 3600) {
      const minutes = Math.floor(timeDiff / 60);
      return `${minutes}m ago`;
    } else if (timeDiff < 86400) {
      const hours = Math.floor(timeDiff / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(timeDiff / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <Card className="p-0">
      <CardContent className="p-5">
        <div className="mb-3 flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Cube01 className="text-primary size-6" />
            <Button variant="link" asChild className="p-0">
              <Link
                href={ROUTES.BLOCK.replace(':id', block.block_number.toString())}
                className="text-primary text-xl font-medium"
              >
                {block.block_number}
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">{getTimeAgo(block.block_timestamp)}</p>
        </div>
        <div className="space-y-2 text-sm font-medium">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Txn</span>
            <span className="text-right font-normal">{block.transaction_count}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Validator</span>
            <div className="w-24">
              <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS} className="text-primary text-right font-normal">
                {block.miner}
              </MiddleTruncate>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
