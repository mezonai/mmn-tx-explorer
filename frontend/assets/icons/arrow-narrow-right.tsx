import { forwardRef, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export const ArrowNarrowRight = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <path d="M3.16669 8H13.8334M13.8334 8L9.83335 4M13.8334 8L9.83335 12" />
    </svg>
  );
});

ArrowNarrowRight.displayName = 'ArrowNarrowRight';
