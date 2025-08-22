import { forwardRef, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export const ChevronLeft = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <path d="M10 12L6 8L10 4" />
    </svg>
  );
});

ChevronLeft.displayName = 'ChevronLeft';
