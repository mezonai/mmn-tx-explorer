import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface DescriptionDisplayProps {
  description: string;
  lineShow?: number;
  className?: string;
}

export const DescriptionDisplay = ({ description, lineShow, className }: DescriptionDisplayProps) => {
  const clampStyle: CSSProperties | undefined = lineShow
    ? {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: lineShow,
        overflow: 'hidden',
      }
    : undefined;

  return (
    <div
      className={cn('mt-2 w-full text-sm leading-6 break-words text-gray-600 dark:text-gray-400', className)}
      style={clampStyle}
    >
      <div className="whitespace-pre-line">{description.split('\n\n').join('\n\n')}</div>
    </div>
  );
};
