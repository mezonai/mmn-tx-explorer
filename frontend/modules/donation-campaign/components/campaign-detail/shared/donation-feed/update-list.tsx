'use client';
import { DonationCampaign, IDonationFeed } from '@/modules/donation-campaign';
import { useState } from 'react';
import { UpdatePost } from './update-post';
import { ipfsServiceURL } from '@/service';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export const UpdateList = ({ updates, campaign }: { updates: IDonationFeed[]; campaign: DonationCampaign }) => {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const allImages = updates.flatMap((update) => update.image_cids || []);

  const handleImageClick = (imageCid: string) => {
    const index = allImages.indexOf(imageCid);
    if (index !== -1) {
      setCurrentIndex(index);
      setOpen(true);
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, allImages.length]);

  return (
    <>
      <div className="space-y-4">
        {updates.map((update) => (
          <UpdatePost key={update.id} update={update} campaign={campaign} onImageClick={handleImageClick} />
        ))}
      </div>

      {open && allImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={handleClose}>
          <Button
            onClick={handleClose}
            className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>

          {allImages.length > 1 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute top-1/2 left-4 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          <div
            className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${ipfsServiceURL}/${allImages[currentIndex]}`}
              alt={`Image ${currentIndex + 1} of ${allImages.length}`}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              loading="eager"
            />
          </div>

          {allImages.length > 1 && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute top-1/2 right-4 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              {currentIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
};
