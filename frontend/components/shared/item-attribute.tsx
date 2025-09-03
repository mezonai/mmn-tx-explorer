import { ReactNode } from 'react';

import { InfoSquare } from '@/assets/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ItemAttributeProps {
  label: string;
  tooltip?: string;
  children: ReactNode;
}

export const ItemAttribute = ({ label, tooltip, children }: ItemAttributeProps) => {
  const hasTooltip = Boolean(tooltip?.trim());

  return (
    <div className="items-center space-y-1 md:grid md:grid-cols-[200px_calc(100%-200px)] md:space-y-0">
      <div className="flex items-center gap-2">
        {hasTooltip && (
          <Tooltip>
            <TooltipTrigger>
              <InfoSquare className="text-foreground-quaternary-400 size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <span className="text-secondary-700 text-sm font-semibold">{label}</span>
      </div>
      <div className="text-secondary-700 text-sm font-normal">{children}</div>
    </div>
  );
};
