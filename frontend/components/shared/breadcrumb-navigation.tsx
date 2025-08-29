import { Fragment } from 'react';

import { IBreadcrumb } from '@/types';
import Link from 'next/link';
import {
  Breadcrumb as BreadcrumbComponent,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

interface BreadcrumbNavigationProps {
  breadcrumbs: IBreadcrumb[];
}

export function BreadcrumbNavigation({ breadcrumbs }: BreadcrumbNavigationProps) {
  return (
    <BreadcrumbComponent>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <Fragment key={breadcrumb.label}>
              <BreadcrumbItem>
                {isLast ? (
                  <p className="text-foreground cursor-default px-2 py-1 text-sm font-semibold">{breadcrumb.label}</p>
                ) : (
                  <BreadcrumbLink
                    className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm font-semibold"
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
}
