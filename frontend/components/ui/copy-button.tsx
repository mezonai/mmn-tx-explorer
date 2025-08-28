'use client';

import { CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Copy01 } from '@/assets/icons';
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
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    try {
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    } finally {
      document.body.removeChild(textarea);
    }
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
          className={cn(
            'text-foreground-quaternary-400 hover:text-muted-foreground size-4 flex-shrink-0 align-middle hover:bg-transparent',
            className
          )}
          onClick={handleCopy}
        >
          {isCopied ? <CheckCheck strokeWidth={1.5} /> : <Copy01 />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isCopied ? 'Copied' : 'Copy to clipboard'}</TooltipContent>
    </Tooltip>
  );
};
