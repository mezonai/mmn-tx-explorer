import { useState } from 'react';

import { Copy01 } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MiddleTruncate } from '@re-dev/react-truncate';

interface ValidatorAddressProps {
  address: string;
  className?: string;
}

export const ValidatorAddress = ({ address, className }: ValidatorAddressProps) => {
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
      <span className="text-primary w-24 text-sm font-normal">
        <MiddleTruncate end={4}>{address}</MiddleTruncate>
      </span>
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
