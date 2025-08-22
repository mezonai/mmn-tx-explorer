'use client';

import { cn } from '@/lib/utils';

function EllipsisText({
  children,
  className,
  keepLast = 0,
}: {
  children: string;
  className?: string;
  keepLast?: number;
}) {
  const ellipsisedText = children.slice(0, children.length - keepLast);
  const alwaysShowText = children.slice(children.length - keepLast);

  return (
    <>
      <div className={cn('overflow-hidden text-ellipsis', className)}>{ellipsisedText}</div>
      <span>{alwaysShowText}</span>
    </>
  );
}

export { EllipsisText };
