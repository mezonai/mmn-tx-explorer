import { forwardRef, SVGProps } from 'react';
import { cn } from '@/lib/utils';

export const RedEnvelopeIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="120"
      viewBox="0 0 100 120"
      fill="none"
      className={cn(className)}
      {...props}
    >
      <rect x="5" y="5" width="90" height="110" rx="10" fill="black" />
      <rect x="10" y="10" width="80" height="100" rx="8" fill="#DC2626" />
      <path d="M10 10 L50 45 L90 10" stroke="#991B1B" strokeWidth="2" fill="none" />
      <path d="M10 10 L50 45 L90 10 Z" fill="#B91C1C" opacity="0.5" />
      <circle cx="50" cy="50" r="12" fill="#FBBF24" />
      <circle cx="50" cy="50" r="8" fill="#F59E0B" />
    </svg>
  );
});

RedEnvelopeIcon.displayName = 'RedEnvelopeIcon';
