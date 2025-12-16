import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface DescriptionDisplayProps {
  description: string;
  lineShow?: number;
  className?: string;
}

export const DescriptionDisplay = ({ description, lineShow, className }: DescriptionDisplayProps) => {
  const lineClampClass =
    lineShow === 1
      ? 'line-clamp-1'
      : lineShow === 2
        ? 'line-clamp-2'
        : lineShow === 3
          ? 'line-clamp-3'
          : lineShow === 4
            ? 'line-clamp-4'
            : lineShow === 5
              ? 'line-clamp-5'
              : lineShow === 6
                ? 'line-clamp-6'
                : '';

  const customStyle: CSSProperties | undefined =
    lineShow && lineShow > 6
      ? {
          display: '-webkit-box',
          WebkitLineClamp: lineShow,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : undefined;

  return (
    <div
      className={cn(
        'mt-2 w-full text-sm leading-6 break-words whitespace-pre-line text-gray-600 dark:text-gray-400',
        lineClampClass,
        className
      )}
      style={customStyle}
    >
      {description.split('\n\n').map((para, i) => (
        <p key={i} className="mb-4 leading-6 whitespace-pre-line last:mb-0">
          {para}
        </p>
      ))}
    </div>
  );
};
