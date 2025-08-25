import { ReactNode } from 'react';

import { InfoSquare } from '@/assets/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ItemAttributeProps {
  label: string;
  description?: string;
  render: ReactNode;
}

export function ItemAttribute({ label, description, render }: ItemAttributeProps) {
  return (
    <div className="items-center space-y-1 md:grid md:grid-cols-[200px_calc(100%-200px)] md:space-y-0">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <InfoSquare className="text-muted-foreground size-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="text-sm font-normal">{render}</div>
    </div>
  );
}
