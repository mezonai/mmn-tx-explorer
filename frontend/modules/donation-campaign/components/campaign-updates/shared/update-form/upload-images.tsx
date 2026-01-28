import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, Loader2, X, UploadCloud } from 'lucide-react';
import React, { ChangeEvent, useState, useRef } from 'react';
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
  const maxImagesAllowed = IMAGE_CONSTRAINTS.MAX_IMAGES_ALLOWED;
  const maxSize = IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE;
  const unit = IMAGE_CONSTRAINTS.UNIT;
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget.contains(e.relatedTarget as Node)) return;

    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (totalSize >= maxTotalSize || isCompressing) return;

    const droppedFiles = Array.from(e.dataTransfer.files);

    const validFiles = droppedFiles.filter(
      (file) => allowedTypes.includes(file.type) || /\.(jpg|jpeg|png|heic|heif)$/i.test(file.name)
    );

    if (validFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      validFiles.forEach((file) => dataTransfer.items.add(file));

      const syntheticEvent = {
        target: {
          files: dataTransfer.files,
        },
      } as ChangeEvent<HTMLInputElement>;

      handleImageChange(syntheticEvent);
    }
  };

  return (
    <div
      className="relative rounded-lg transition-all"
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* DRAG OVERLAY */}
      {isDragging && !isCompressing && (
        <div className="border-brand-primary bg-background/90 absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg border-2 border-dashed backdrop-blur-[2px]">
          <div className="bg-brand-primary/10 animate-bounce rounded-full p-4">
            <UploadCloud className="text-brand-primary h-10 w-10" />
          </div>
          <p className="text-brand-primary mt-2 text-sm font-semibold">Drop images here to upload</p>
        </div>
      )}

      {/* Actual Content */}
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
                    className="absolute -top-2 -right-1 z-10 h-6 w-6 rounded-full bg-gray-700 p-0 text-white shadow-md"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {totalSize < maxTotalSize && totalImagesCount < maxImagesAllowed && (
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
                      / {maxSize} {unit}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-brand-primary font-semibold">{totalImagesCount}</span>
                    <span className="text-muted-foreground"> / {maxImagesAllowed} images</span>
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
              <p className="text-muted-foreground/70 text-sm">Click or Drag to upload images</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png, image/jpg, image/heic"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={totalSize >= maxTotalSize || isCompressing}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Supported: JPG, PNG, HEIC Total size limit: {maxSize} {unit} for all images (auto-compressed)
            </p>
            <p className="mt-1 text-xs text-gray-500">Maximum images allowed: {maxImagesAllowed} images</p>
          </div>
        )}
      </div>
    </div>
  );
};
