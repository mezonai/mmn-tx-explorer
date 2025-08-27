import { format } from 'date-fns';
import Link from 'next/link';
import { ComponentType, ReactNode } from 'react';

import { DATE_TIME_FORMAT } from '@/constant';
import { DateTimeUtil } from '@/utils';

interface SearchResultItemProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: ReactNode;
  timestamp: number;
  onSelect: () => void;
}

export const SearchResultItem = ({ href, icon: Icon, title, timestamp, onSelect }: SearchResultItemProps) => {
  return (
    <Link
      href={href}
      className="focus:bg-primary/8 active:bg-primary/8 hover:bg-primary/8 flex flex-col items-start justify-between gap-1 rounded p-2 lg:flex-row lg:items-center lg:gap-2"
      onClick={onSelect}
    >
      <div className="flex w-full flex-1 items-center justify-start gap-2 lg:w-auto">
        <Icon className="text-muted-foreground size-5" />
        <div className="text-foreground w-full flex-1 text-sm lg:w-auto">{title}</div>
      </div>
      <div className="flex flex-col items-start gap-1 lg:w-auto lg:flex-row lg:items-center lg:gap-2">
        <span className="line-clamp-1 text-sm font-medium">
          {format(DateTimeUtil.toMilliseconds(timestamp), DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}
        </span>
      </div>
    </Link>
  );
};
