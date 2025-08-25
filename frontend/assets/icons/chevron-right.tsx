import { forwardRef, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export const ChevronRight = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <path d="M7.5 15L12.5 10L7.5 5" />
    </svg>
  );
});

ChevronRight.displayName = 'ChevronRight';
