import { Chip } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign/type';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { VersionHistoryDialog } from '../../shared/donation-feed';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';
import { JSX, useState } from 'react';
import { useUser } from '@/providers';
import { Eye, EyeClosed, Pencil } from 'lucide-react';
import { useToggleHideDonationFeed } from '@/modules/donation-campaign/hooks';

const MAX_IMAGES_DISPLAY = 18;
const MAX_DESC_CHARACTERS = 300;

interface UpdatePostDesktopProps {
  update: IDonationFeed;
  campaign: DonationCampaign;
  onImageClick: (images: string[], index: number) => void;
  getImages: (imageCids: string[], onImageClick: (images: string[], index: number) => void) => JSX.Element;
  isVersionDialogOpen: boolean;
  setIsVersionDialogOpen: (isOpen: boolean) => void;
}

export const UpdatePostDesktop = ({
  update,
  campaign,
  onImageClick,
  getImages,
  isVersionDialogOpen,
  setIsVersionDialogOpen,
}: UpdatePostDesktopProps) => {
  const { user } = useUser();
  const router = useRouter();

  const [showAllImages, setShowAllImages] = useState(false);
  const visibleImages = showAllImages ? update.image_cids : update.image_cids.slice(0, MAX_IMAGES_DISPLAY);
  const hasMoreImages = update.image_cids.length > MAX_IMAGES_DISPLAY;

  const [expandedDesc, setExpandedDesc] = useState(false);
  const isDescLong = update.description.length > MAX_DESC_CHARACTERS;
  const shortenDescription = expandedDesc ? update.description : update.description.slice(0, MAX_DESC_CHARACTERS);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const toggleHideDonationFeed = useToggleHideDonationFeed();

  const isHidden = !update.visible;
  const isCreator = user?.walletAddress === update.creator_address;
  const hasEditHistory = !!update.parent_hash;
  const showMenu = isCreator || hasEditHistory;

  return (
    <Card
      className={`dark:bg-card border-muted-foreground/30 gap-4 rounded-3xl bg-white/90 pt-3 shadow-sm ${isHidden ? 'border-yellow-500 opacity-60' : ''}`}
    >
      <div className="hidden w-full md:flex md:flex-row md:items-center md:justify-between md:gap-3">
        <div className="flex flex-row flex-wrap items-center gap-2 px-2">
          {isHidden ? (
            <Chip variant="warning" className="border-yellow-500 text-yellow-500">
              Hidden
            </Chip>
          ) : (
            <Chip variant="success" className="">
              On chain
            </Chip>
          )}

          <div className="text-xs text-gray-400">
            <ClientTimeDisplay timestamp={new Date(update.created_at).getTime()} />
          </div>
          <div className="hidden text-xs text-gray-500 lg:block">
            · posted by {update.creator_address.slice(0, 3)}...{update.creator_address.slice(-4)}{' '}
            <CopyButton textToCopy={update.creator_address} />
          </div>
        </div>

        <div
          className={`text-muted-foreground flex flex-row items-center gap-2 px-2 text-xs ${hasEditHistory ? 'justify-between' : 'h-5 justify-end'}`}
        >
          {hasEditHistory && !isHidden && (
            <Chip variant="warning">
              <span>Edited</span>
            </Chip>
          )}
          {showMenu && (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="link"
                  className={`text-muted-foreground hover:text-brand-primary px-2 text-xs font-thin hover:no-underline`}
                >
                  •••
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-background w-auto p-1" align="end">
                <div className="flex flex-col">
                  {isCreator && (
                    <>
                      {!isHidden && (
                        <Button
                          variant="ghost"
                          className="h-8 justify-start text-sm font-normal"
                          onClick={() => router.push(ROUTES.EDIT_DONATION_UPDATE(campaign.slug, String(update.id)))}
                        >
                          <Pencil className="text-primary mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="h-8 justify-start text-sm font-normal"
                        onClick={() => {
                          toggleHideDonationFeed.mutate({
                            root_hash: update.root_hash ?? update.tx_hash,
                            visible: !update.visible,
                          });
                          setIsPopoverOpen(false);
                        }}
                      >
                        {isHidden ? (
                          <>
                            <Eye className="text-primary mr-2 h-4 w-4" />
                            Unhide
                          </>
                        ) : (
                          <>
                            <EyeClosed className="text-primary mr-2 h-4 w-4" />
                            Hide
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {hasEditHistory && !isHidden && (
                    <VersionHistoryDialog
                      update={update}
                      isOpen={isVersionDialogOpen}
                      onOpenChange={setIsVersionDialogOpen}
                    />
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      {isHidden ? (
        <div className="text-foreground text-md w-full px-4">
          <h3 className="text-muted-background text-md italic">
            This update has been hidden from the public feed, but the record remains on chain for audit.
          </h3>
        </div>
      ) : (
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
      )}
      {!isHidden && <>{getImages(visibleImages || [], onImageClick)}</>}
      {!isHidden && (
        <div className="flex w-full flex-row justify-end gap-4 px-4">
          <span className="text-sm">TxHash: </span>
          <span className="w-40">
            <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
          </span>
        </div>
      )}
      {hasMoreImages && !showAllImages && !isHidden && (
        <div className="flex justify-center pb-2">
          <Button variant="link" size="sm" onClick={() => setShowAllImages(true)}>
            See more ({update.image_cids.length - MAX_IMAGES_DISPLAY})
          </Button>
        </div>
      )}
    </Card>
  );
};
