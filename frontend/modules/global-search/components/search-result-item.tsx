import { format } from 'date-fns';
import Link from 'next/link';
import { ComponentType, ReactNode } from 'react';

import { DATE_TIME_FORMAT } from '@/constant';

interface SearchResultItemProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: ReactNode;
  timestamp: number;
}

export const SearchResultItem = ({ href, icon: Icon, title, timestamp }: SearchResultItemProps) => {
  return (
    <Link
      href={href}
      className="focus:bg-primary/8 active:bg-primary/8 hover:bg-primary/8 flex flex-col items-start justify-between gap-1 rounded p-2 lg:flex-row lg:items-center lg:gap-2"
    >
      <div className="flex w-full flex-1 items-center justify-start gap-2 lg:w-auto">
        <Icon className="text-muted-foreground size-5" />
        <div className="text-foreground w-full flex-1 text-sm lg:w-auto">{title}</div>
      </div>
      <div className="flex flex-col items-start gap-1 lg:w-auto lg:flex-row lg:items-center lg:gap-2">
        <span className="line-clamp-1 text-sm font-medium">
          {format(timestamp * 1000, DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}
        </span>
      </div>
    </Link>
  );
};
