import { Button } from '@/components/ui/button';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Eye, EyeClosed, Pencil } from 'lucide-react';
import { VersionHistoryDialog } from '../../shared';
import { Chip } from '@/components/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToggleHideDonationFeed } from '@/modules/donation-campaign/hooks';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign/type';
import { ROUTES } from '@/configs/routes.config';

interface UpdatePostHeaderProps {
  update: IDonationFeed;
  campaign: DonationCampaign;
  isCreator: boolean;
  hasEditHistory: boolean;
  isHidden: boolean;
  isVersionDialogOpen: boolean;
  setIsVersionDialogOpen: (isOpen: boolean) => void;
  onImageClick: (images: string[], index: number) => void;
}

export const UpdatePostHeader = ({
  update,
  campaign,
  isCreator,
  hasEditHistory,
  isHidden,
  isVersionDialogOpen,
  setIsVersionDialogOpen,
}: UpdatePostHeaderProps) => {
  const router = useRouter();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const toggleHideDonationFeed = useToggleHideDonationFeed();
  const showMenu = isCreator || hasEditHistory;
  return (
    <div className="flex flex-col gap-2 md:hidden">
      <div className="flex items-center justify-between px-2">
        <div className="px-2 text-xs text-gray-400">
          <ClientTimeDisplay timestamp={new Date(update.created_at).getTime()} />
        </div>
        {showMenu && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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

      <div className="flex flex-row flex-wrap items-center gap-2 px-2">
        {isHidden ? (
          <Chip variant="warning" className="border-yellow-500 text-yellow-500">
            Hidden
          </Chip>
        ) : (
          <Chip variant="success">On chain</Chip>
        )}
        {hasEditHistory && !isHidden && (
          <Chip variant="warning">
            <span>Edited</span>
          </Chip>
        )}
      </div>
    </div>
  );
};
