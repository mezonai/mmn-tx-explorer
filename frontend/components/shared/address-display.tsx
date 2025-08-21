import { MiddleTruncate } from '@re-dev/react-truncate';
import { useState } from 'react';

import { Copy01 } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { cn } from '@/lib/utils';

interface AddressDisplayProps {
  address: string;
  className?: string;
}

export const AddressDisplay = ({ address, className }: AddressDisplayProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-24">
        <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS} className="text-primary text-sm font-normal">
          {address}
        </MiddleTruncate>
      </div>
      <Tooltip open={isCopied}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="size-6 flex-shrink-0" onClick={handleCopy}>
            <Copy01 className="text-muted-foreground size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copied!</TooltipContent>
      </Tooltip>
    </div>
  );
};
