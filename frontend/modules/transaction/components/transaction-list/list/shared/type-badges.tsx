import { CheckCircle } from '@/assets/icons';
import { cn } from '@/lib/utils';

interface TypeBadgesProps {
  className?: string;
}

export const TypeBadges = ({ className }: TypeBadgesProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="cursor-default rounded-lg border border-orange-200 bg-orange-50 px-1.5 py-1">
        <span className="whitespace-nowrap text-orange-700">Token transfer</span>
      </div>
      <div className="flex cursor-default items-center justify-center gap-1 rounded-lg border px-1.5 py-1">
        <CheckCircle className="size-3 text-green-600" />
        <span>Success</span>
      </div>
    </div>
  );
};
