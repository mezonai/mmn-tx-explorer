'use client';
import { IDonationFeed } from '@/modules/donation-campaign';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/shared';
import { CopyButton } from '@/components/ui/copy-button';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';

// function getStatusChip(update: IDonationFeed) {
//   if (update.status === 'hidden') {
//     return (
//       <Chip variant="default" className="rounded-md">
//         {update.title}
//       </Chip>
//     );
//   }
//   return (
//     <Chip variant="brand" className="rounded-md">
//       {update.title}
//     </Chip>
//   );
// }

// function getStatusWarning(update: CampaignUpdates) {
//   if (update.status === 'older') {
//     return (
//       <Chip variant="warning" className="mt-2 self-start rounded-md">
//         Edited · New version on chain
//       </Chip>
//     );
//   }
//   if (update.status === 'hidden') {
//     return (
//       <Chip variant="warning" className="mt-2 self-start rounded-md">
//         Hidden from public feed
//       </Chip>
//     );
//   }
//   return null;
// }

// function getStatusAction(update: CampaignUpdates) {
//   if (update.status === 'recent') {
//     return (
//       <span className="inline-flex items-center gap-1">
//         <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
//         <p>On chain</p>
//       </span>
//     );
//   }
//   if (update.status === 'older') {
//     return (
//       <Link href="#" className="underline">
//         See previous version
//       </Link>
//     );
//   }
//   return (
//     <Link href="#" className="underline">
//       Unhide
//     </Link>
//   );
// }

// function getContent(update: CampaignUpdates) {
//   if (update.status === 'hidden') {
//     return <i>This update has been hidden from the public feed, but the record remains on chain for audit.</i>;
//   }
//   return update.content;
// }

function getImages(update: IDonationFeed, onImageClick: (url: string) => void) {
  return (
    <div className="grid w-full grid-cols-1 gap-2 p-2 pl-3 sm:grid-cols-3 md:grid-cols-6">
      {update.extra_info.image_cids.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Update Image ${idx + 1}`}
          className="h-40 w-full cursor-pointer rounded-md object-cover sm:h-32 md:h-24"
          onClick={() => onImageClick(img)}
        />
      ))}
    </div>
  );
}

export const UpdateList = ({ updates }: { updates: IDonationFeed[] }) => {
  const [open, setOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const handleImageClick = (img: string) => {
    setSelectedImg(img);
    setOpen(true);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSelectedImg(null);
  };

  return (
    <>
      <div className="space-y-4">
        {updates.map((update, index) => (
          <Card
            className={`dark:bg-dark dark:bg-card border-muted-foreground/30 gap-4 rounded-3xl bg-white/90 shadow-sm`}
            key={update.id}
          >
            <div className="flex w-full flex-col justify-between gap-3 px-4 md:flex-row">
              <div className="flex flex-row flex-wrap gap-2">
                <Chip variant="brand" className="rounded-md">
                  {update.extra_info.title}
                </Chip>

                <div className="pt-2 text-xs text-gray-400">
                  <ClientTimeDisplay timestamp={new Date(update.created_at).getTime()} />
                </div>
                <div className="pt-2 text-xs text-gray-500 lg:block">
                  · posted by {update.owner_address.slice(0, 3)}...{update.owner_address.slice(-4)}{' '}
                  <CopyButton textToCopy={update.owner_address} />
                </div>
                {/* {getStatusWarning(update)} */}
              </div>

              {index === 0 && (
                <div className="text-muted-foreground flex flex-row gap-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <p>On chain</p>
                  </span>
                </div>
              )}
            </div>
            <div className="text-foreground text-md w-full px-4 break-words">{update.extra_info.description}</div>

            {getImages(update, handleImageClick)}

            <div className="flex w-full flex-row justify-end gap-4 px-4">
              <span className="text-sm">TxHash: </span>
              <span className="w-40">
                <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
              </span>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex max-h-[95vh] max-w-[95vw] flex-col items-center justify-center bg-transparent p-0 shadow-none">
          {selectedImg && (
            <img src={selectedImg} alt="Full Preview" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
          )}
          <DialogTitle></DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  );
};
