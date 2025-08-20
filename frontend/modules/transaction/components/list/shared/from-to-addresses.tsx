'use client';

import { MiddleTruncate } from '@re-dev/react-truncate';
import { useState } from 'react';

import { ArrowDown, ArrowNarrowRight, Copy01 } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FromToAddressesProps {
  fromAddress: string;
  toAddress: string;
}

export const FromToAddresses = ({ fromAddress, toAddress }: FromToAddressesProps) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex w-full items-center gap-2 xl:w-auto">
      <div className="hidden lg:block">
        <ArrowDown className="text-muted-foreground size-4" />
      </div>
      <div className="flex flex-1 flex-row justify-between gap-3 lg:flex-col">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary w-24 truncate text-sm font-normal">
              <MiddleTruncate end={4}>{fromAddress}</MiddleTruncate>
            </span>
            <Tooltip open={copiedAddress === fromAddress}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 flex-shrink-0"
                  onClick={() => handleCopy(fromAddress)}
                >
                  <Copy01 className="text-muted-foreground size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copied!</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-center justify-center lg:hidden">
          <ArrowNarrowRight className="text-muted-foreground size-4" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary w-24 truncate text-sm font-normal">
              <MiddleTruncate end={4}>{toAddress}</MiddleTruncate>
            </span>
            <Tooltip open={copiedAddress === toAddress}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 flex-shrink-0"
                  onClick={() => handleCopy(toAddress)}
                >
                  <Copy01 className="text-muted-foreground size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copied!</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
