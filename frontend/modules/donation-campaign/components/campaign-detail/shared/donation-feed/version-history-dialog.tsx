'use client';

import { IDonationFeed } from '@/modules/donation-campaign';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClientTimeDisplay } from '@/modules/transaction/components/transaction-details/shared/client-time-display';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { ipfsServiceURL } from '@/service';
import { useDonationFeedHistory } from '@/modules/donation-campaign/hooks';
import { Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { ImageViewerModal } from './image-viewer-modal';

const MAX_IMAGES_DISPLAY = 4;
const MAX_DESC_CHARACTERS = 200;

interface VersionHistoryDialogProps {
  update: IDonationFeed;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function getImages(imageCids: string[], onImageClick: (images: string[], index: number) => void) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {imageCids.map((img, idx) => (
        <img
          key={idx}
          src={`${ipfsServiceURL}/${img}`}
          alt={`Update Image ${idx + 1}`}
          className="h-20 w-full cursor-pointer rounded-md object-cover"
          onClick={() => onImageClick(imageCids, idx)}
        />
      ))}
    </div>
  );
}

export const VersionHistoryDialog = ({ update, isOpen, onOpenChange }: VersionHistoryDialogProps) => {
  const { donationFeedHistoryResponse, isLoading, error } = useDonationFeedHistory(update.root_hash);
  const history = donationFeedHistoryResponse?.data || [];
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const [showAllImagesForVersion, setShowAllImagesForVersion] = useState<Record<string, boolean>>({});

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState<string[]>([]);

  const toggleDescription = (txHash: string) => {
    setExpandedVersions((prev) => ({ ...prev, [txHash]: !prev[txHash] }));
  };

  const toggleShowAllImages = (txHash: string) => {
    setShowAllImagesForVersion((prev) => ({ ...prev, [txHash]: !prev[txHash] }));
  };

  const handleImageClick = (images: string[], index: number) => {
    const normalizedImages = Array.isArray(images) ? images : [];
    setViewerImages(normalizedImages);
    setCurrentIndex(index);
    setImageModalOpen(true);
  };

  const handleImageModalClose = () => {
    setImageModalOpen(false);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && imageModalOpen) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="h-8 justify-start p-0 text-sm font-normal">
            <RotateCcw className="text-primary mr-2 h-4 w-4" />
            See previous version
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle className="text-primary">Update Version History</DialogTitle>
          </DialogHeader>
          <div className="bg-background space-y-4 py-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-brand-primary h-12 w-12 animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-8">
                <p className="text-red-500">Error loading version history.</p>
              </div>
            )}

            {!isLoading && !error && history.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No version history available.</p>
              </div>
            )}

            {!isLoading && !error && history.length > 0 && (
              <div className="space-y-3">
                {history.map((version: IDonationFeed, index: number) => {
                  const isExpanded = expandedVersions[version.tx_hash] || false;
                  const isDescLong = version.description.length > MAX_DESC_CHARACTERS;
                  const shortenDescription = isExpanded
                    ? version.description
                    : version.description.slice(0, MAX_DESC_CHARACTERS);

                  const showAllImages = showAllImagesForVersion[version.tx_hash] || false;
                  const visibleImages = showAllImages
                    ? version.image_cids
                    : version.image_cids.slice(0, MAX_IMAGES_DISPLAY);
                  const hasMoreImages = version.image_cids.length > MAX_IMAGES_DISPLAY;

                  return (
                    <div key={version.tx_hash} className="bg-card rounded-lg border p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="text-muted-foreground mb-1 text-xs">
                          <ClientTimeDisplay timestamp={new Date(version.created_at).getTime()} />
                        </div>
                        {index === 0 && (
                          <div className="text-muted-foreground flex flex-row gap-1 text-xs">
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                              <p>On chain</p>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <h4 className="mb-1 text-sm font-semibold break-words">{version.title}</h4>
                          <div className="text-muted-foreground text-sm break-words">
                            {shortenDescription.split('\n').map((line, idx, arr) => (
                              <span key={idx}>
                                {line}
                                {idx < arr.length - 1 && (
                                  <>
                                    <br />
                                    <span className="block h-3" />
                                  </>
                                )}
                              </span>
                            ))}

                            {!isExpanded && isDescLong && (
                              <span
                                className="text-brand-primary ml-1 cursor-pointer text-sm font-semibold hover:underline"
                                onClick={() => toggleDescription(version.tx_hash)}
                              >
                                … See more
                              </span>
                            )}

                            {isExpanded && isDescLong && (
                              <span
                                className="text-brand-primary ml-1 cursor-pointer text-sm font-semibold hover:underline"
                                onClick={() => toggleDescription(version.tx_hash)}
                              >
                                {' '}
                                Show less
                              </span>
                            )}
                          </div>
                        </div>

                        {version.image_cids && version.image_cids.length > 0 && (
                          <>
                            {getImages(visibleImages, (images, idx) => handleImageClick(images, idx))}

                            {hasMoreImages && !showAllImages && (
                              <div className="flex justify-start">
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => toggleShowAllImages(version.tx_hash)}
                                  className="text-brand-primary h-auto p-0 text-sm font-semibold hover:underline"
                                >
                                  See more ({version.image_cids.length - MAX_IMAGES_DISPLAY})
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          TxHash:
                          <TxnHashLink hash={version.tx_hash} isPending={false} className="text-brand-primary" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-lg border p-4 opacity-50">
                  <p className="text-center text-xs text-gray-500">Previous versions will appear here when available</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ImageViewerModal
        isOpen={imageModalOpen}
        images={viewerImages}
        initialIndex={currentIndex}
        onClose={handleImageModalClose}
      />
    </>
  );
};
