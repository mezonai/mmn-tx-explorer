import { forwardRef, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export const ArrowDown = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <path d="M8.00004 3.33337V12.6667M8.00004 12.6667L12.6667 8.00004M8.00004 12.6667L3.33337 8.00004" />
    </svg>
  );
});

ArrowDown.displayName = 'ArrowDown';
