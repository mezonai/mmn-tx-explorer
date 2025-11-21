import React from 'react';
import { CircleEllipsis, OctagonXIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { getVisualStatus } from '@/modules/lucky-money/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
  {
    variants: {
      visualStatus: {
        live: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 gap-1.5',
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 gap-1.5',
        closed: 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-400 gap-1.5',
        failed: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 gap-1.5',
      },
    },
    defaultVariants: {
      visualStatus: 'closed',
    }
  }
);

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
}

export const StatusBadge = ({ className, status, ...props }: StatusBadgeProps) => {
  const visualStatus = getVisualStatus(status);
  return (
    <span
      className={cn(statusBadgeVariants({ visualStatus }), className)}
      {...props}
    >
      {visualStatus === 'live' && (
        <>
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </>
      )}
      {visualStatus === 'pending' && (
        <>
          <CircleEllipsis className="w-3.5 h-3.5 text-yellow-500" />
          Pending
        </>
      )}
      {visualStatus === 'failed' && (
        <>
          <CircleEllipsis className="w-3.5 h-3.5 text-red-500" />
          Failed
        </>
      )}

      {visualStatus === 'closed' && (
        <>
          🔒 Closed
        </>
      )}
    </span>
  );
};
