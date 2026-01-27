import { Chip } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { ROUTES } from '@/configs/routes.config';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Eye, EyeClosed, Pencil } from 'lucide-react';
import { VersionHistoryDialog } from '../../shared';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign/type';
import { useRouter } from 'next/navigation';
import { useToggleHideDonationFeed } from '@/modules/donation-campaign/hooks';
import { useState } from 'react';

interface UpdatePostHeaderProps {
  isHidden: boolean;
  hasEditHistory: boolean;
  isCreator: boolean;
  update: IDonationFeed;
  campaign: DonationCampaign;
  isVersionDialogOpen: boolean;
  setIsVersionDialogOpen: (isOpen: boolean) => void;
}

export const UpdatePostHeader = ({
  isHidden,
  hasEditHistory,
  isCreator,
  update,
  campaign,
  isVersionDialogOpen,
  setIsVersionDialogOpen,
}: UpdatePostHeaderProps) => {
  const router = useRouter();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const toggleHideDonationFeed = useToggleHideDonationFeed();
  const showMenu = isCreator || hasEditHistory;

  return (
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
        {isCreator && (
          <div className="hidden text-xs text-gray-500 lg:block">
            · posted by {update.creator_address.slice(0, 3)}...{update.creator_address.slice(-4)}{' '}
            <CopyButton textToCopy={update.creator_address} />
          </div>
        )}
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
                        onClick={() => router.push(ROUTES.EDIT_DONATION_UPDATE(campaign.slug, update.tx_hash))}
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
  );
};
