import { Button } from '@/components/ui/button';
import { IDonationFeed } from '@/modules/donation-campaign/type';
import { JSX } from 'react';

interface UpdatePostBodyProps {
  update: IDonationFeed;
  isHidden: boolean;
  shortenDescription: string;
  isDescLong: boolean;
  expandedDesc: boolean;
  setExpandedDesc: (expanded: boolean) => void;
  getImages: (imageCids: string[], onImageClick: (images: string[], index: number) => void) => JSX.Element;
  onImageClick: (images: string[], index: number) => void;
  maxImagesDisplay: number;
  showAllImages: boolean;
  hasMoreImages: boolean;
  setShowAllImages: (showAll: boolean) => void;
}

export const UpdatePostBody = ({
  update,
  isHidden,
  shortenDescription,
  isDescLong,
  expandedDesc,
  setExpandedDesc,
  getImages,
  onImageClick,
  maxImagesDisplay,
  showAllImages,
  hasMoreImages,
  setShowAllImages,
}: UpdatePostBodyProps) => {
  const visibleImages = showAllImages ? update.image_cids : update.image_cids.slice(0, maxImagesDisplay);
  return (
    <>
      {isHidden ? (
        <div className="text-foreground text-md w-full px-4">
          <h3 className="text-muted-background text-md italic">
            This update has been hidden from the public feed, but the record remains on chain for audit.
          </h3>
        </div>
      ) : (
        <div className="text-foreground text-md w-full px-4">
          <h3 className="text-lg font-semibold break-words text-gray-900 dark:text-white">{update.title}</h3>

          <div className="mt-2 text-sm break-words">
            {shortenDescription.split('\n').map((line, index, arr) => (
              <span key={index}>
                {line}
                {index < arr.length - 1 && (
                  <>
                    <br />
                    <span className="block h-3" />
                  </>
                )}
              </span>
            ))}

            {!expandedDesc && isDescLong && (
              <span
                className="text-brand-primary ml-1 cursor-pointer text-sm font-semibold hover:underline"
                onClick={() => setExpandedDesc(true)}
              >
                … See more
              </span>
            )}

            {expandedDesc && isDescLong && (
              <span
                className="text-brand-primary ml-1 cursor-pointer text-sm font-semibold hover:underline"
                onClick={() => setExpandedDesc(false)}
              >
                {' '}
                Show less
              </span>
            )}
          </div>
        </div>
      )}
      {!isHidden && <>{getImages(visibleImages || [], onImageClick)}</>}
      {hasMoreImages && !showAllImages && !isHidden && (
        <div className="flex justify-center pb-2">
          <Button variant="link" size="sm" onClick={() => setShowAllImages(true)}>
            See more ({update.image_cids.length - maxImagesDisplay})
          </Button>
        </div>
      )}
    </>
  );
};
