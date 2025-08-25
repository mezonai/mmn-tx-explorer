import { MiddleTruncate } from '@re-dev/react-truncate';

import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/copy-button';

interface AddressDisplayProps {
  address: string;
  className?: string;
}

export const AddressDisplay = ({ address, className }: AddressDisplayProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-24">
        <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS} className="text-primary text-sm font-normal">
          {address}
        </MiddleTruncate>
      </div>
      <CopyButton textToCopy={address} className="text-muted-foreground" />
    </div>
  );
};
