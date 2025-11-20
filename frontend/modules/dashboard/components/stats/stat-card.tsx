import { ComponentType, SVGProps } from 'react';
import { useEffect, useState } from 'react';
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

  const useTheme = () => {
    const [isDark, setIsDark] = useState(() =>
      typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false
    );
    useEffect(() => {
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }, []);
    return isDark;
  };

  const isDark = useTheme();
  const getAccent = (t: string) => {
    if (isDark) {
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
    }
    return { bg: 'bg-[var(--color-brand-link)]/20', icon: 'text-[var(--color-brand-link)]' };
  };

  const accent = getAccent(title);
  const unit = subValue ? ` ${subValue.replace(/[()]/g, '')}` : '';

  const cardClassName = cn(
    'p-0',
    'bg-card dark:bg-slate-800',
    'shadow-sm dark:shadow-sm',
    'hover:border-primary/50 rounded-xl border border-gray-300 transition-colors dark:border-gray-700'
  );

  return (
    <Card className={cardClassName}>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accent.bg)}>
            {faIconClass ? (
              <i className={cn(faIconClass, accent.icon)} />
            ) : (
              Icon && <Icon className={cn('size-5', accent.icon)} strokeWidth={2} />
            )}
          </div>
          <span className="font-mono text-xs text-gray-400">{deriveLabel(title)}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <>
            <h3 className="font-mono text-2xl font-bold">
              {NumberUtil.formatWithCommas(value ?? 0)}
              {unit}
            </h3>
            <p className="mt-1 text-sm text-gray-400">{title}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
