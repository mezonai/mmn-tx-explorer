import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, Loader2, X } from 'lucide-react';
import { ChangeEvent } from 'react';
import { formatFileSize } from '@/utils';
import { IMAGE_CONSTRAINTS } from '@/modules/donation-campaign/constants';

interface UploadImagesProps {
  previews: string[];
  handleRemoveImage: (idx: number) => void;
  handleRemoveAll: () => void;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isCompressing: boolean;
  totalSize: number;
  totalImagesCount: number;
  isFetchingLocalSizes: boolean;
}

export const UploadImages = ({
  previews,
  handleRemoveImage,
  handleRemoveAll,
  handleImageChange,
  isCompressing,
  totalSize,
  totalImagesCount,
  isFetchingLocalSizes,
}: UploadImagesProps) => {
  const maxTotalSize = IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE * 1024 * 1024;
  return (
    <div>
      {previews.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {previews.map((src, idx) => (
              <div key={idx} className="group relative">
                <img
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="hover:border-primary/40 shadow-primary/20 h-32 w-full rounded border object-cover shadow-sm hover:shadow-md"
                />
                <Button
                  variant="ghost"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute -top-2 -right-1 h-6 w-6 rounded-full bg-gray-700 p-0 text-white shadow-md"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {totalSize < maxTotalSize && totalImagesCount < IMAGE_CONSTRAINTS.MAX_IMAGES_ALLOWED && (
              <label className="hover:border-brand-primary flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 transition-colors">
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-400">Add More</span>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={totalSize >= maxTotalSize || isCompressing}
                />
              </label>
            )}
          </div>
          <div className="mt-3 flex flex-col items-center gap-3 py-3 md:flex-row md:justify-between">
            <p className="text-xs font-medium text-gray-600">
              {isFetchingLocalSizes ? (
                <>Calculating total size...</>
              ) : (
                <>
                  <span className="text-brand-primary font-semibold">{formatFileSize(totalSize)}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    / {IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE} {IMAGE_CONSTRAINTS.UNIT}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-brand-primary font-semibold">{totalImagesCount}</span>
                  <span className="text-muted-foreground"> / {IMAGE_CONSTRAINTS.MAX_IMAGES_ALLOWED} images</span>
                </>
              )}
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveAll}
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/60 dark:hover:bg-destructive/80 text-xs dark:text-white"
            >
              Remove all images
            </Button>
          </div>
        </>
      )}
      {isCompressing && (
        <div className="text-brand-primary flex items-center justify-center gap-2 p-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Compressing images...</span>
        </div>
      )}
      {previews.length === 0 && (
        <div>
          <p className="text-primary mb-1 text-xs tracking-[0.2em] uppercase dark:text-white">Upload Photos</p>
          <label className="bg-background hover:border-brand-primary border-muted-foreground mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center">
            <div className="bg-background flex h-12 w-12 items-center justify-center rounded-xl text-3xl">
              <Folder className="text-brand-primary" />
            </div>
            <p className="text-muted-foreground/70 text-sm">Click to upload images</p>
            <Input
              type="file"
              accept="image/jpeg, image/png, image/jpg, image/heic"
              multiple
              onChange={handleImageChange}
              className="hidden"
              disabled={totalSize >= maxTotalSize || isCompressing}
            />
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Supported: JPG, PNG, HEIC Total size limit: {IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE} {IMAGE_CONSTRAINTS.UNIT} for all images (auto-compressed)
          </p>
          <p className="mt-1 text-xs text-gray-500">Maximum images allowed: {IMAGE_CONSTRAINTS.MAX_IMAGES_ALLOWED} images</p>
        </div>
      )}
    </div>
  );
};
