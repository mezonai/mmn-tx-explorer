import { MiddleTruncate } from '@re-dev/react-truncate';
import Link from 'next/link';

import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/copy-button';
import { Button } from '../ui/button';

interface AddressDisplayProps {
  address: string;
  className?: string;
  addressClassName?: string;
  href?: string;
}

export const AddressDisplay = ({ address, className, addressClassName, href }: AddressDisplayProps) => {
  const addressContent = (
    <MiddleTruncate
      end={ADDRESS_END_VISIBLE_CHARS}
      className={cn('flex h-6 items-center text-sm', href && 'text-brand-secondary-700', addressClassName)}
    >
      {address}
    </MiddleTruncate>
  );

  return (
    <div className={cn('flex w-30 items-center gap-2', className)}>
      <div className="h-6 w-full">
        {href ? (
          <Button variant="link" className="size-fit w-full p-0" asChild>
            <Link href={href}>{addressContent}</Link>
          </Button>
        ) : (
          addressContent
        )}
      </div>
      <CopyButton textToCopy={address} />
    </div>
  );
};
