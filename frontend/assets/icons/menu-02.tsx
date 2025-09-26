import { forwardRef, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export const Menu02 = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <path d="M3 12H15M3 6H21M3 18H21" />
    </svg>
  );
});

Menu02.displayName = 'Menu02';
