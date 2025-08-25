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

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textarea);
  };

  const handleCopy = async () => {
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    } else {
      fallbackCopy(textToCopy);
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
          className={cn('size-4 flex-shrink-0 align-middle', className)}
          onClick={handleCopy}
        >
          {isCopied ? <CheckCheck /> : <Copy />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isCopied ? 'Copied' : 'Copy to clipboard'}</TooltipContent>
    </Tooltip>
  );
};
