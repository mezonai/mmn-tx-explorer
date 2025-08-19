'use client';

import { CheckCheck, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface CopyButtonProps {
  textToCopy: string;
}

function CopyButton({ textToCopy }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const resetCopied = setTimeout(() => {
      setIsCopied(false);
    }, 1000);

    return () => clearTimeout(resetCopied);
  }, [isCopied]);

  const doCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground-quaternary-400 hover:text-secondary-700 ml-2 size-7 flex-shrink-0 align-middle"
          onClick={doCopy}
        >
          {isCopied ? <CheckCheck className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isCopied ? 'Copied' : 'Copy to clipboard'}</TooltipContent>
    </Tooltip>
  );
}

export { CopyButton };
