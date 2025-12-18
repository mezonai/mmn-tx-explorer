import { Card } from '@/components/ui/card';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign/type';
import { UpdatePostHeader } from './update-post-header';
import { UpdatePostBody } from '../../shared/donation-feed/update-post/';
import { useUser } from '@/providers';
import { JSX, useState } from 'react';
import { UpdatePostFooter } from '../../shared/donation-feed/update-post/';
import { useRouter } from 'next/navigation';
import { useToggleHideDonationFeed } from '@/modules/donation-campaign/hooks';

const MAX_IMAGES_DISPLAY = 18;
const MAX_DESC_CHARACTERS = 300;

interface UpdatePostDesktopProps {
  update: IDonationFeed;
  campaign: DonationCampaign;
  onImageClick: (url: string) => void;
  getImages: (imageCids: string[], onImageClick: (url: string) => void) => JSX.Element;
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
      <UpdatePostHeader
        isHidden={isHidden}
        hasEditHistory={hasEditHistory}
        isCreator={isCreator}
        update={update}
        campaign={campaign}
        isVersionDialogOpen={isVersionDialogOpen}
        setIsVersionDialogOpen={setIsVersionDialogOpen}
        onImageClick={onImageClick}
      />
      <UpdatePostBody
        update={update}
        isHidden={isHidden}
        shortenDescription={shortenDescription}
        isDescLong={isDescLong}
        expandedDesc={expandedDesc}
        setExpandedDesc={setExpandedDesc}
        getImages={getImages}
        onImageClick={onImageClick}
        maxImagesDisplay={MAX_IMAGES_DISPLAY}
        showAllImages={showAllImages}
        hasMoreImages={hasMoreImages}
        setShowAllImages={setShowAllImages}
      />
      <UpdatePostFooter isHidden={isHidden} update={update} />
    </Card>
  );
};
