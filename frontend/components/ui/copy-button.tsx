'use client';

import { CheckCheck, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

export const CopyButton = ({ textToCopy, className }: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    if (!isCopied) return;

    const resetCopied = setTimeout(() => {
      setIsCopied(false);
    }, 1000);

    return () => clearTimeout(resetCopied);
  }, [isCopied]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('hover:text-secondary-700 size-7 flex-shrink-0 align-middle', className)}
          onClick={handleCopy}
        >
          {isCopied ? <CheckCheck className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isCopied ? 'Copied' : 'Copy to clipboard'}</TooltipContent>
    </Tooltip>
  );
};
