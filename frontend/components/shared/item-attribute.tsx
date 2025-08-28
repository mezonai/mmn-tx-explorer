import { ReactNode } from 'react';

import { InfoSquare } from '@/assets/icons';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ItemAttributeProps<D> {
  label: string;
  description?: string;
  data: D;
  render: (data: NonNullable<D>) => ReactNode;
  skeleton?: ReactNode;
}

export function ItemAttribute<D>({
  label,
  description,
  data,
  render,
  skeleton = <Skeleton className="h-4 w-full" />,
}: ItemAttributeProps<D>) {
  return (
    <div className="items-center space-y-1 md:grid md:grid-cols-[200px_calc(100%-200px)] md:space-y-0">
      {data ? (
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
      ) : (
        <Skeleton className="h-5 w-40 md:w-[85%]" />
      )}
      <div className="text-sm font-normal">{data ? render(data) : skeleton}</div>
    </div>
  );
}
