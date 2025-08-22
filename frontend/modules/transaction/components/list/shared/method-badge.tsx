import { cn } from '@/lib/utils';

interface MethodBadgeProps {
  method: string;
  className?: string;
}

export const MethodBadge = ({ method, className }: MethodBadgeProps) => {
  if (!method) {
    return <p>-</p>;
  }

  return <p className={cn('bg-muted w-fit rounded-md border px-2 py-1', className)}>{method}</p>;
};
