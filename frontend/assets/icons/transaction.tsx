import { forwardRef, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export const Transaction = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn(className)}
      {...props}
    >
      <path d="M21 14C21 13.4477 20.5523 13 20 13H4.00001C3.59571 13 3.23097 13.2436 3.07618 13.6172C2.92139 13.9912 3.00684 14.4209 3.29298 14.707L8.29298 19.707C8.48829 19.9023 8.74415 20 9.00001 20C9.25587 20 9.51173 19.9023 9.70704 19.707C10.0977 19.3164 10.0977 18.6836 9.70704 18.293L6.41407 15H20C20.5523 15 21 14.5522 21 14ZM3.00001 9.99999C3.00001 10.5522 3.44776 11 4.00001 11H20C20.4043 11 20.769 10.7563 20.9238 10.3828C21.0786 10.0088 20.9932 9.57909 20.707 9.29296L15.707 4.29296C15.3164 3.90235 14.6836 3.90235 14.293 4.29296C13.9024 4.68358 13.9024 5.3164 14.293 5.70702L17.5859 8.99999H4.00001C3.44776 8.99999 3.00001 9.44774 3.00001 9.99999Z" />
    </svg>
  );
});

Transaction.displayName = 'Transaction';
