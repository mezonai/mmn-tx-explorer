import { forwardRef, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export const ChevronLeftDouble = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
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
      <path d="M15 14.1666L10.8333 9.99992L15 5.83325M9.16667 14.1666L5 9.99992L9.16667 5.83325" />
    </svg>
  );
});

ChevronLeftDouble.displayName = 'ChevronLeftDouble';
