import { Chip } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign/type';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { VersionHistoryDialog } from '../../shared/donation-feed';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';
import { JSX, useState } from 'react';
import { useUser } from '@/providers';
import { Pencil } from 'lucide-react';

const MAX_IMAGES_DISPLAY = 3;
const MAX_DESC_CHARACTERS = 200;

interface UpdatePostMobileProps {
  update: IDonationFeed;
  campaign: DonationCampaign;
  onImageClick: (url: string) => void;
  getImages: (imageCids: string[], onImageClick: (url: string) => void) => JSX.Element;
  isVersionDialogOpen: boolean;
  setIsVersionDialogOpen: (isOpen: boolean) => void;
}

export const UpdatePostMobile = ({
  update,
  campaign,
  onImageClick,
  getImages,
  isVersionDialogOpen,
  setIsVersionDialogOpen,
}: UpdatePostMobileProps) => {
  const { user } = useUser();
  const router = useRouter();

  const [showAllImages, setShowAllImages] = useState(false);
  const visibleImages = showAllImages ? update.image_cids : update.image_cids.slice(0, MAX_IMAGES_DISPLAY);
  const hasMoreImages = update.image_cids.length > MAX_IMAGES_DISPLAY;

  const [expandedDesc, setExpandedDesc] = useState(false);
  const isDescLong = update.description.length > MAX_DESC_CHARACTERS;
  const shortenDescription = expandedDesc ? update.description : update.description.slice(0, MAX_DESC_CHARACTERS);

  return (
    <Card className={`dark:bg-card border-muted-foreground/30 gap-4 rounded-3xl bg-white/90 pt-3 shadow-sm`}>
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-center justify-between px-2">
          <div className="px-2 text-xs text-gray-400">
            <ClientTimeDisplay timestamp={new Date(update.created_at).getTime()} />
          </div>
          {(user?.walletAddress === update.creator_address || update.parent_hash) && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="link"
                  className="text-muted-foreground hover:text-brand-primary px-2 text-xs font-thin hover:no-underline"
                >
                  •••
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-background w-auto p-1" align="end">
                <div className="flex flex-col">
                  {user?.walletAddress === update.creator_address && (
                    <Button
                      variant="ghost"
                      className="h-8 justify-start text-sm font-normal"
                      onClick={() => router.push(ROUTES.EDIT_DONATION_UPDATE(campaign.slug, String(update.id)))}
                    >
                      <Pencil className="text-primary mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {update.parent_hash && (
                    <VersionHistoryDialog
                      update={update}
                      isOpen={isVersionDialogOpen}
                      onOpenChange={setIsVersionDialogOpen}
                      onImageClick={onImageClick}
                    />
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex flex-row flex-wrap items-center gap-2 px-2">
          <Chip variant="success">On chain</Chip>
          {update.parent_hash && (
            <Chip variant="warning">
              <span>Edited</span>
            </Chip>
          )}
        </div>
      </div>

      <div className="text-foreground text-md w-full px-4">
        <h3 className="text-lg font-semibold break-words text-gray-900 dark:text-white">{update.title}</h3>

        <div className="mt-2 text-sm break-words">
          {shortenDescription.split('\n').map((line, index, arr) => (
            <span key={index}>
              {line}
              {index < arr.length - 1 && (
                <>
                  <br />
                  <span className="block h-3" />
                </>
              )}
            </span>
          ))}

          {!expandedDesc && isDescLong && (
            <span
              className="text-brand-primary ml-1 cursor-pointer text-sm font-semibold hover:underline"
              onClick={() => setExpandedDesc(true)}
            >
              … See more
            </span>
          )}

          {expandedDesc && isDescLong && (
            <span
              className="text-brand-primary ml-1 cursor-pointer text-sm font-semibold hover:underline"
              onClick={() => setExpandedDesc(false)}
            >
              {' '}
              Show less
            </span>
          )}
        </div>
      </div>

      {getImages(visibleImages || [], onImageClick)}

      <div className="flex w-full flex-row justify-end gap-4 px-4">
        <span className="text-sm">TxHash: </span>
        <span className="w-40">
          <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
        </span>
      </div>
      {hasMoreImages && !showAllImages && (
        <div className="flex justify-center pb-2">
          <Button variant="link" size="sm" onClick={() => setShowAllImages(true)}>
            See more ({update.image_cids.length - MAX_IMAGES_DISPLAY})
          </Button>
        </div>
      )}
    </Card>
  );
};
