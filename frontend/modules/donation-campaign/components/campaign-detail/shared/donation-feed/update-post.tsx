'use client';

import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/shared';
import { CopyButton } from '@/components/ui/copy-button';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { ipfsServiceURL } from '@/service';
import { VersionHistoryDialog } from './version-history-dialog';
import { useState } from 'react';
import { useUser } from '@/providers';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ROUTES } from '@/configs/routes.config';
import { useRouter } from 'next/navigation';


interface UpdatePostProps {
  update: IDonationFeed;
  campaign: DonationCampaign;
  onImageClick: (url: string) => void;
}

function getImages(imageCids: string[], onImageClick: (url: string) => void) {
  return (
    <div className="grid w-full grid-cols-1 gap-2 p-2 pl-3 sm:grid-cols-3 md:grid-cols-6">
      {imageCids.map((img, idx) => (
        <img
          key={idx}
          src={`${ipfsServiceURL}/${img}`}
          alt={`Update Image ${idx + 1}`}
          className="h-35 w-full cursor-pointer rounded-md object-cover"
          onClick={() => onImageClick(img)}
        />
      ))}
    </div>
  );
}

export const UpdatePost = ({ update, campaign, onImageClick }: UpdatePostProps) => {
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  return (
    <Card className={`dark:bg-card border-muted-foreground/30 gap-4 rounded-3xl bg-white/90 shadow-sm`}>
      <div className="flex w-full flex-col justify-between gap-3 px-4 md:flex-row">
        <div className="flex flex-row flex-wrap gap-2">
          <Chip variant="brand" className="">
            {update.title}
          </Chip>

          <div className="pt-2 text-xs text-gray-400">
            <ClientTimeDisplay timestamp={new Date(update.created_at).getTime()} />
          </div>
          {update.creator_address && (
            <div className="pt-2 text-xs text-gray-500 lg:block">
              · posted by {update.creator_address.slice(0, 3)}...{update.creator_address.slice(-4)}{' '}
              <CopyButton textToCopy={update.creator_address} />
            </div>
          )}
          {update.parent_hash && (
            <Chip variant="warning" className="text-xs">
              Edited - new version on chain
            </Chip>
          )}
        </div>

        <div className="text-muted-foreground flex flex-row gap-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <p>On chain</p>
          </span>

          {update.parent_hash && (
            <div className="text-muted-foreground flex flex-row gap-1 text-xs">
              <span className="inline-flex items-center gap-1">
                |
                <VersionHistoryDialog
                  update={update}
                  isOpen={isVersionDialogOpen}
                  onOpenChange={setIsVersionDialogOpen}
                  onImageClick={onImageClick}
                />
              </span>
            </div>
          )}
          {user?.walletAddress === update.creator_address && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="link"
                  className="text-xs text-muted-foreground font-thin p-0 pl-2 hover:no-underline hover:text-brand-primary"
                >
                  •••
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-1" align="end">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    className="justify-start text-sm font-normal h-8"
                    onClick={() => router.push(ROUTES.EDIT_DONATION_UPDATE(campaign.slug, update.tx_hash))}
                  >
                    Edit
                  </Button>
                  {/* <Button
                    variant="ghost"
                    className="justify-start text-sm font-normal h-8"
                    onClick={() => {
                    }}
                  >
                    Hide
                  </Button> */}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      <div className="text-foreground text-md w-full px-4 break-words">{update.description}</div>

      {getImages(update.image_cids || [], onImageClick)}

      <div className="flex w-full flex-row justify-end gap-4 px-4">
        <span className="text-sm">TxHash: </span>
        <span className="w-40">
          <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
        </span>
      </div>
    </Card>
  );
};
