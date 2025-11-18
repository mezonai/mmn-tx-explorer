import { ComponentType, SVGProps } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberUtil } from '@/utils';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  faIconClass?: string;
  title: string;
  value?: number;
  subValue?: string;
}

export const StatCard = ({ icon: Icon, faIconClass, title, value, subValue }: StatCardProps) => {
  const isLoading = value === undefined;
  const deriveLabel = (t: string) => {
    const upper = t.toUpperCase();
    const trimmed = upper.replace(/^TOTAL\s+/, '').replace(/^AVERAGE\s+/, '');
    return trimmed;
  };

  const getAccent = (t: string) => {
    // Use exact RGB color for Total Blocks to match brand purple
    switch (t) {
      case 'Total Blocks':
        return { bg: 'bg-[var(--color-brand-link)]/20', icon: 'text-[var(--color-brand-link)]' };
      case 'Total Transactions':
        return { bg: 'bg-blue-500/20', icon: 'text-blue-400' };
      case 'Average Block Time':
        return { bg: 'bg-green-500/20', icon: 'text-green-400' };
      case 'Total Wallet':
        return { bg: 'bg-orange-500/20', icon: 'text-orange-400' };
      case 'Total Give Coffee':
        return { bg: 'bg-yellow-500/20', icon: 'text-yellow-400' };
      default:
        return { bg: 'bg-[var(--color-brand-link)]/20', icon: 'text-[var(--color-brand-link)]' };
    }
  };

  const accent = getAccent(title);
  const unit = subValue ? ` ${subValue.replace(/[()]/g, '')}` : '';

  const cardClassName = cn(
    'p-0',
    'bg-card dark:bg-slate-800 border border-gray-700 rounded-xl hover:border-primary/50 transition-colors'
  );

  return (
    <Card className={cardClassName}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', accent.bg)}>
            {faIconClass ? (
              <i className={cn(faIconClass, accent.icon)} />
            ) : (
              Icon && <Icon className={cn('size-5', accent.icon)} strokeWidth={2} />
            )}
          </div>
          <span className="text-xs text-gray-400 font-mono">{deriveLabel(title)}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <>
            <h3 className="text-2xl font-bold font-mono">{NumberUtil.formatWithCommas(value ?? 0)}{unit}</h3>
            <p className="text-gray-400 text-sm mt-1">{title}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};