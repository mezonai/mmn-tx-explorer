import { MiddleTruncate } from '@re-dev/react-truncate';

import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/copy-button';

interface AddressDisplayProps {
  address: string;
  className?: string;
  addressClassName?: string;
}

export const AddressDisplay = ({ address, className, addressClassName }: AddressDisplayProps) => {
  return (
    <div className={cn('flex w-30 items-center gap-2', className)}>
      <div className="w-full">
        <MiddleTruncate
          end={ADDRESS_END_VISIBLE_CHARS}
          className={cn('text-primary flex h-6 items-center text-sm font-normal', addressClassName)}
        >
          {address}
        </MiddleTruncate>
      </div>
      <CopyButton textToCopy={address} />
    </div>
  );
};
