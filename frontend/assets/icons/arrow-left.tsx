import { forwardRef, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export const ArrowLeft = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
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
      <path d="M15.8333 10.0001H4.16663M4.16663 10.0001L9.99996 15.8334M4.16663 10.0001L9.99996 4.16675" />
    </svg>
  );
});

ArrowLeft.displayName = 'ArrowLeft';
