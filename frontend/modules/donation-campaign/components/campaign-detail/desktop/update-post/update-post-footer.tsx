import { Button } from '@/components/ui/button';
import { IDonationFeed } from '@/modules/donation-campaign/type';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';

interface UpdatePostFooterProps {
  isHidden: boolean;
  hasMoreImages: boolean;
  update: IDonationFeed;
  showAllImages: boolean;
  setShowAllImages: (showAll: boolean) => void;
  maxImagesDisplay?: number;
}

export const UpdatePostFooter = ({
  isHidden,
  hasMoreImages,
  update,
  showAllImages,
  setShowAllImages,
  maxImagesDisplay = 18,
}: UpdatePostFooterProps) => {
  return (
    <>
      {!isHidden && (
        <div className="flex w-full flex-row justify-end gap-4 px-4">
          <span className="text-sm">TxHash: </span>
          <span className="w-40">
            <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
          </span>
        </div>
      )}
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
