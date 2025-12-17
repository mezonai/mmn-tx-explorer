'use client';

import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign';
import { ipfsServiceURL } from '@/service';
import { useState } from 'react';
import { UpdatePostDesktop } from '../../../desktop/update-post';
import { UpdatePostMobile } from '../../../mobile/update-post';
import { useBreakpoint } from '@/hooks';
import { EBreakpoint } from '@/enums';

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
  const isMobile = !(useBreakpoint(EBreakpoint.MD) ?? true);
  return (
    <>
      {isMobile ? (
        <UpdatePostMobile
          update={update}
          campaign={campaign}
          onImageClick={onImageClick}
          getImages={getImages}
          isVersionDialogOpen={isVersionDialogOpen}
          setIsVersionDialogOpen={setIsVersionDialogOpen}
        />
      ) : (
        <UpdatePostDesktop
          update={update}
          campaign={campaign}
          onImageClick={onImageClick}
          getImages={getImages}
          isVersionDialogOpen={isVersionDialogOpen}
          setIsVersionDialogOpen={setIsVersionDialogOpen}
        />
      )}
    </>
  );
};
