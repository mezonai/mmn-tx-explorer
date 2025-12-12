'use client';

import { IDonationFeed } from '@/modules/donation-campaign';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { ipfsServiceURL } from '@/service';
import { useDonationFeedHistory } from '@/modules/donation-campaign/hooks';
import { Loader2, RotateCcw } from 'lucide-react';

interface VersionHistoryDialogProps {
  update: IDonationFeed;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImageClick: (url: string) => void;
}

export const VersionHistoryDialog = ({ update, isOpen, onOpenChange, onImageClick }: VersionHistoryDialogProps) => {
  const { donationFeedHistoryResponse, isLoading, error } = useDonationFeedHistory(update.root_hash);
  const history = donationFeedHistoryResponse?.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-8 justify-start p-0 text-sm font-normal">
          <RotateCcw className="text-primary mr-2 h-4 w-4" />
          See previous version
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <DialogTitle className="text-primary">Update Version History</DialogTitle>
        </DialogHeader>
        <div className="bg-background space-y-4 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-brand-primary h-12 w-12 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-500">Error loading version history.</p>
            </div>
          )}

          {!isLoading && !error && history.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No version history available.</p>
            </div>
          )}

          {!isLoading && !error && history.length > 0 && (
            <div className="space-y-3">
              {history.map((version: IDonationFeed, index: number) => (
                <div key={version.tx_hash} className="bg-card rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="text-muted-foreground mb-1 text-xs">
                      <ClientTimeDisplay timestamp={new Date(version.created_at).getTime()} />
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

                  <div className="space-y-2">
                    <div>
                      <h4 className="mb-1 text-sm font-semibold break-words">{version.title}</h4>
                      <p className="text-muted-foreground text-sm break-words">{version.description}</p>
                    </div>

                    {version.image_cids && version.image_cids.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {version.image_cids.map((cid, idx) => (
                          <img
                            key={idx}
                            src={`${ipfsServiceURL}/${cid}`}
                            alt={`Version ${history.length - index} Image ${idx + 1}`}
                            className="h-20 w-full cursor-pointer rounded-md object-cover"
                            onClick={() => onImageClick(cid)}
                          />
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      TxHash:
                      <TxnHashLink hash={version.tx_hash} isPending={false} className="text-brand-primary" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border p-4 opacity-50">
                <p className="text-center text-xs text-gray-500">Previous versions will appear here when available</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
