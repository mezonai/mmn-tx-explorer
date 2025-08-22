import { CircleAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ItemAttributeProps {
  label: string;
  description?: string;
  render: React.ReactNode;
}

export function ItemAttribute({ label, description, render }: ItemAttributeProps) {
  return (
    <div className="min-h-7 items-center space-y-2 md:grid md:grid-cols-[200px_calc(100%-200px)] md:space-y-0">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <CircleAlert className="text-foreground-quaternary-400 size-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-secondary-700 text-sm font-semibold">{label}</span>
      </div>
      <div className="text-secondary-700 text-sm font-normal">{render}</div>
    </div>
  );
}
