import Link from 'next/link';
import { Fragment } from 'react';

import { cn } from '@/lib/utils';
import { IBreadcrumb } from '@/types';
import {
  Breadcrumb as BreadcrumbComponent,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

interface BreadcrumbTrailProps {
  breadcrumbs: IBreadcrumb[];
  className?: string;
}

export const BreadcrumbTrail = ({ breadcrumbs, className }: BreadcrumbTrailProps) => {
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <BreadcrumbComponent className={cn(className)}>
      <BreadcrumbList className="gap-1 sm:gap-1">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const key = `${breadcrumb.href}-${breadcrumb.label}-${index}`;

          return (
            <Fragment key={key}>
              <BreadcrumbItem>
                {isLast ? (
                  <p className="text-tertiary_hover cursor-default px-2 py-1 text-sm font-semibold" aria-current="page">
                    {breadcrumb.label}
                  </p>
                ) : (
                  <BreadcrumbLink
                    className="text-quaternary-500 hover:text-tertiary_hover px-2 py-1 text-sm font-semibold"
                    asChild
                  >
                    <Link href={breadcrumb.href ?? '#'}>{breadcrumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbComponent>
  );
};
