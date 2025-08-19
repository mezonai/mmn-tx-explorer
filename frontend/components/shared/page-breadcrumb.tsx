import { Breadcrumb } from '@/types';
import {
  Breadcrumb as BreadcrumbComponent,
  BreadcrumbLink,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';

interface PageBreadcrumbProps {
  breadcrumbs: Breadcrumb[];
}

export function PageBreadcrumb({ breadcrumbs }: PageBreadcrumbProps) {
  return (
    <div>
      <BreadcrumbComponent>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <Fragment key={breadcrumb.href}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className={cn(
                      'text-quaternary-500 hover:text-secondary-700 text-sm font-semibold',
                      index === breadcrumbs.length - 1 && 'text-secondary-700 bg-secondary-alt rounded-md px-3 py-1.5'
                    )}
                    href={isLast ? undefined : breadcrumb.href}
                  >
                    {breadcrumb.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </BreadcrumbComponent>
    </div>
  );
}
