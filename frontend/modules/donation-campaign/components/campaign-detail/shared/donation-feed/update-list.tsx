'use client';

import { useState } from 'react';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign';
import { UpdatePost } from './update-post';
import { ImageViewerModal } from './image-viewer-modal';

interface UpdateListProps {
  updates: IDonationFeed[];
  campaign: DonationCampaign;
}

export const UpdateList = ({ updates, campaign }: UpdateListProps) => {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState<string[]>([]);

  const handleImageClick = (images: string[], index: number) => {
    const normalizedImages = Array.isArray(images) ? images : [];
    setViewerImages(normalizedImages);
    setCurrentIndex(index);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <div className="space-y-4">
        {updates.map((update) => (
          <UpdatePost
            key={update.id}
            update={update}
            campaign={campaign}
            onImageClick={(images, index) => handleImageClick(images, index)}
          />
        ))}
      </div>

      <ImageViewerModal isOpen={open} images={viewerImages} initialIndex={currentIndex} onClose={handleClose} />
    </>
  );
};
