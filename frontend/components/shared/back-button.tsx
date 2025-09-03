import Link from 'next/link';

import { ArrowLeft } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label = 'Back', className }: BackButtonProps) {
  return (
    <Button variant="link" className={cn('flex size-fit items-center gap-1 !p-0', className)} asChild>
      <Link href={href}>
        <ArrowLeft className="text-foreground-quaternary-400 size-5" strokeWidth={1.67} />
        <p className="text-tertiary-600 text-sm font-semibold">{label}</p>
      </Link>
    </Button>
  );
}
