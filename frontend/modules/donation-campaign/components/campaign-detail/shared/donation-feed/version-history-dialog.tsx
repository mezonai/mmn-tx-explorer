'use client';

import { IDonationFeed } from '@/modules/donation-campaign';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Chip } from '@/components/shared';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { ipfsServiceURL } from '@/service';

interface VersionHistoryDialogProps {
  update: IDonationFeed;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImageClick: (url: string) => void;
}

export const VersionHistoryDialog = ({ update, isOpen, onOpenChange, onImageClick }: VersionHistoryDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-muted-foreground p-0 text-xs">
          See previous version
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <DialogTitle className="text-primary">Update Version History</DialogTitle>
        </DialogHeader>
        <div className="bg-background space-y-4 py-4">
          <div className="text-muted-foreground text-sm">
            <p className="mb-4">This feature will show the version history of this update.</p>

            <div className="space-y-3">
              {/* Current Version */}
              <div className="bg-card rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-muted-foreground text-xs">
                    <ClientTimeDisplay timestamp={new Date(update.created_at).getTime()} />
                  </span>
                  <Chip variant="info" className="text-xs font-semibold">
                    Current Version
                  </Chip>
                </div>

                <p className="text-sm">{update.extra_info.description}</p>
                {update.extra_info.image_cids.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {update.extra_info.image_cids.map((cid, idx) => (
                      <img
                        key={idx}
                        src={`${ipfsServiceURL}/${cid}`}
                        alt={`Version image ${idx + 1}`}
                        className="h-20 w-20 cursor-pointer rounded object-cover"
                        onClick={() => onImageClick(cid)}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  TxHash: <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
                </div>
              </div>

              {/* Previous Version (Placeholder) */}
              <div className="bg-card rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-muted-foreground text-xs">
                    <ClientTimeDisplay timestamp={new Date(update.created_at).getTime()} />
                  </span>
                </div>

                <p className="text-sm">{update.extra_info.description}</p>
                {update.extra_info.image_cids.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {update.extra_info.image_cids.map((cid, idx) => (
                      <img
                        key={idx}
                        src={`${ipfsServiceURL}/${cid}`}
                        alt={`Version image ${idx + 1}`}
                        className="h-20 w-20 cursor-pointer rounded object-cover"
                        onClick={() => onImageClick(cid)}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  TxHash: <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
                </div>
              </div>

              {/* Placeholder for future versions */}
              <div className="rounded-lg border p-4 opacity-50">
                <p className="text-center text-xs text-gray-500">Previous versions will appear here when available</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
