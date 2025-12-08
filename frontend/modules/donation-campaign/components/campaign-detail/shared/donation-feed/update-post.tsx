'use client';

import { IDonationFeed } from '@/modules/donation-campaign';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/shared';
import { CopyButton } from '@/components/ui/copy-button';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { baseURL } from '@/service';

interface UpdatePostProps {
  update: IDonationFeed;
  isLatest?: boolean;
  onImageClick: (url: string) => void;
}

function getImages(imageCids: string[], onImageClick: (url: string) => void) {
  return (
    <div className="grid w-full grid-cols-1 gap-2 p-2 pl-3 sm:grid-cols-3 md:grid-cols-6">
      {imageCids.map((img, idx) => (
        <img
          key={idx}
          src={`http://${baseURL}/ipfs/${img}`}
          alt={`Update Image ${idx + 1}`}
          className="h-40 w-full cursor-pointer rounded-md object-cover sm:h-32 md:h-24"
          onClick={() => onImageClick(img)}
        />
      ))}
    </div>
  );
}

export const UpdatePost = ({ update, isLatest = false, onImageClick }: UpdatePostProps) => {
  return (
    <Card className={`dark:bg-dark dark:bg-card border-muted-foreground/30 gap-4 rounded-3xl bg-white/90 shadow-sm`}>
      <div className="flex w-full flex-col justify-between gap-3 px-4 md:flex-row">
        <div className="flex flex-row flex-wrap gap-2">
          <Chip variant="brand" className="">
            {update.extra_info.title}
          </Chip>

          <div className="pt-2 text-xs text-gray-400">
            <ClientTimeDisplay timestamp={new Date(update.created_at).getTime()} />
          </div>
          <div className="pt-2 text-xs text-gray-500 lg:block">
            · posted by {update.owner_address.slice(0, 3)}...{update.owner_address.slice(-4)}{' '}
            <CopyButton textToCopy={update.owner_address} />
          </div>
        </div>

        {isLatest && (
          <div className="text-muted-foreground flex flex-row gap-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <p>On chain</p>
            </span>
          </div>
        )}
      </div>
      <div className="text-foreground text-md w-full px-4 break-words">{update.extra_info.description}</div>

      {getImages(update.extra_info.image_cids, onImageClick)}

      <div className="flex w-full flex-row justify-end gap-4 px-4">
        <span className="text-sm">TxHash: </span>
        <span className="w-40">
          <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
        </span>
      </div>
    </Card>
  );
};
