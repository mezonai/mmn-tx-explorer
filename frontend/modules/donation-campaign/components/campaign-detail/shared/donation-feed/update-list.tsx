'use client';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { UpdatePost } from './update-post';
import { ipfsServiceURL } from '@/service';

export const UpdateList = ({ updates, campaign }: { updates: IDonationFeed[]; campaign: DonationCampaign }) => {
  const [open, setOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const handleImageClick = (img: string) => {
    setSelectedImg(img);
    setOpen(true);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSelectedImg(null);
  };

  return (
    <>
      <div className="space-y-4">
        {updates.map((update) => (
          <UpdatePost key={update.id} update={update} campaign={campaign} onImageClick={handleImageClick} />
        ))}
      </div>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex h-fit max-h-[95vh] w-fit max-w-[95vw] flex-col items-center justify-center border-none bg-transparent p-4 shadow-none [&>button]:-top-2 [&>button]:-right-2 [&>button]:flex [&>button]:h-13 [&>button]:w-13 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-gray-700 [&>button]:text-white [&>button]:opacity-100">
          {selectedImg && (
            <img
              src={`${ipfsServiceURL}/${selectedImg}`}
              alt="Full Preview"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          )}
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  );
};
