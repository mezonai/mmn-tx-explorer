import { Card } from '@/components/ui/card';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign/type';
import { JSX, useState } from 'react';
import { useUser } from '@/providers';
import { UpdatePostHeader } from './update-post-header';
import { UpdatePostBody } from '../../shared/donation-feed/update-post/';
import { UpdatePostFooter } from '../../shared/donation-feed/update-post/';

const MAX_IMAGES_DISPLAY = 3;
const MAX_DESC_CHARACTERS = 200;

interface UpdatePostMobileProps {
  update: IDonationFeed;
  campaign: DonationCampaign;
  onImageClick: (images: string[], index: number) => void;
  getImages: (imageCids: string[], onImageClick: (images: string[], index: number) => void) => JSX.Element;
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

  const [showAllImages, setShowAllImages] = useState(false);
  const hasMoreImages = update.image_cids.length > MAX_IMAGES_DISPLAY;

  const [expandedDesc, setExpandedDesc] = useState(false);
  const isDescLong = update.description.length > MAX_DESC_CHARACTERS;
  const shortenDescription = expandedDesc ? update.description : update.description.slice(0, MAX_DESC_CHARACTERS);

  const isHidden = !update.visible;
  const isCreator = user?.walletAddress === update.creator_address;
  const hasEditHistory = !!update.parent_hash;

  return (
    <Card
      className={`dark:bg-card border-muted-foreground/30 gap-4 rounded-3xl bg-white/90 pt-3 shadow-sm ${isHidden ? 'border-yellow-500 opacity-60' : ''}`}
    >
      <UpdatePostHeader
        update={update}
        campaign={campaign}
        isCreator={isCreator}
        hasEditHistory={hasEditHistory}
        isHidden={isHidden}
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
