import { cn } from '@/lib/utils';

interface DescriptionDisplayProps {
  description: string;
  lineShow?: number;
  className?: string;
}

export const DescriptionDisplay = ({ description, lineShow, className }: DescriptionDisplayProps) => {
  return (
    <div
      className={cn(
        'mt-2 w-full text-sm leading-6 break-words whitespace-pre-line text-gray-600 dark:text-gray-400',
        lineShow && `line-clamp-${lineShow}`,
        className
      )}
    >
      {description.split('\n\n').map((para, i) => (
        <p key={i} className="mb-4 leading-6 whitespace-pre-line last:mb-0">
          {para}
        </p>
      ))}
    </div>
  );
};
