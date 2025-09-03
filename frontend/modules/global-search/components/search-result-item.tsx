import { format } from 'date-fns';
import Link from 'next/link';
import { ComponentType, ReactNode, SVGProps } from 'react';

import { DATE_TIME_FORMAT } from '@/constant';
import { DateTimeUtil } from '@/utils';

interface SearchResultItemProps {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: ReactNode;
  timestamp: number;
}

export const SearchResultItem = ({ href, icon: Icon, title, timestamp }: SearchResultItemProps) => {
  return (
    <Link
      href={href}
      className="focus:bg-brand-primary active:bg-brand-primary hover:bg-brand-primary flex flex-col items-start justify-between gap-1 rounded p-2 lg:flex-row lg:items-center lg:gap-2"
    >
      <div className="flex w-full flex-1 items-center justify-start gap-2 lg:w-auto">
        <Icon className="text-foreground-quaternary-400 size-5" />
        <div className="text-foreground w-full flex-1 text-base font-normal lg:w-auto">{title}</div>
      </div>
      <div className="flex flex-col items-start gap-1 lg:w-auto lg:flex-row lg:items-center lg:gap-2">
        <span className="text-quaternary-500 line-clamp-1 text-sm font-normal">
          {format(DateTimeUtil.toMilliseconds(timestamp), DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}
        </span>
      </div>
    </Link>
  );
};
