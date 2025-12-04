'use client';
import { IDonationFeed } from '@/modules/donation-campaign';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { UpdatePost } from './update-post';

export const UpdateList = ({ updates }: { updates: IDonationFeed[] }) => {
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
        {updates.map((update, index) => (
          <UpdatePost key={update.id} update={update} isLatest={index === 0} onImageClick={handleImageClick} />
        ))}
      </div>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex max-h-[95vh] max-w-[95vw] flex-col items-center justify-center bg-transparent p-0 shadow-none">
          {selectedImg && (
            <img src={selectedImg} alt="Full Preview" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
          )}
          <DialogTitle></DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  );
};
