import { useState, ChangeEvent } from 'react';
import { toast } from 'sonner';
import { formatFileSize } from '@/utils';
import { ipfsServiceURL } from '@/service';
import { IMAGE_CONSTRAINTS } from '../constants';
import { ImageCompression } from './ImageCompression';

interface UploadDonationImageProps {
  onImagesUpdate: (base64Images: string[], existingCids: string[]) => void;
  initialExistingCids?: string[];
}

export const UploadDonationImage = ({ onImagesUpdate, initialExistingCids = [] }: UploadDonationImageProps) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const { compressImage } = ImageCompression();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImageCids, setExistingImageCids] = useState<string[]>(initialExistingCids);
  const [existingImagesSize, setExistingImagesSize] = useState<number>(0);

  const newImagesSize = images.reduce((sum, img) => sum + img.size, 0);
  const totalSize = newImagesSize + existingImagesSize;
  const maxTotalSize = IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE * 1024 * 1024;

  const setExistingSize = (size: number) => {
    setExistingImagesSize(size);
  };

  const initializeExistingImages = (cids: string[]) => {
    setExistingImageCids(cids);
    setPreviews(cids.map((cid) => `${ipfsServiceURL}/${cid}`));
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // Validate file types - check both MIME type and extension for HEIC
    const invalidFiles = files.filter((file) => {
      const isValidMimeType = IMAGE_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.type);
      const hasHeicExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      return !isValidMimeType && !hasHeicExtension;
    });

    if (invalidFiles.length > 0) {
      toast.error(
        `Only JPEG, JPG, PNG, and HEIC images are allowed. Invalid file(s): ${invalidFiles.map((f) => f.name).join(', ')}`
      );
      e.target.value = '';
      return;
    }

    const availableSize = maxTotalSize - totalSize;

    if (availableSize <= 0) {
      toast.error(
        `Total size limit reached (${IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE} ${IMAGE_CONSTRAINTS.UNIT} for all images).`
      );
      e.target.value = '';
      return;
    }

    try {
      setIsCompressing(true);
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            let processedFile = file;
            const isHeic =
              file.type === 'image/heic' ||
              file.type === 'image/heif' ||
              file.name.toLowerCase().endsWith('.heic') ||
              file.name.toLowerCase().endsWith('.heif');

            if (isHeic) {
              try {
                const heic2any = (await import('heic2any')).default;
                const convertedBlob = await heic2any({
                  blob: file,
                  toType: 'image/jpeg',
                  quality: 0.9,
                });

                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                  type: 'image/jpeg',
                });
              } catch (err) {
                toast.error(`Failed to convert HEIC file: ${file.name}`);
                return null;
              }
            }

            const compressedFile = await compressImage(processedFile);

            if (compressedFile && compressedFile.size > availableSize) {
              toast.error(
                `Cannot upload ${file.name} as it exceeds the available size limit. Available size: ${(
                  availableSize /
                  (1024 * 1024)
                ).toFixed(2)} ${IMAGE_CONSTRAINTS.UNIT}.`
              );
              return null;
            }
            return compressedFile;
          } catch (err) {
            return null;
          }
        })
      );

      const validFiles = compressedFiles.filter((file): file is File => file !== null);

      if (validFiles.length > 0) {
        const newImages = [...images, ...validFiles];
        const newImagesTotal = newImages.reduce((sum, img) => sum + img.size, 0);
        const combinedTotalSize = newImagesTotal + existingImagesSize;

        if (combinedTotalSize > maxTotalSize) {
          toast.error(
            `Total size would exceed ${IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE} ${IMAGE_CONSTRAINTS.UNIT} limit. Current: ${formatFileSize(totalSize)}. Try uploading fewer or smaller images.`
          );
        } else if (newImages.length + existingImageCids.length > IMAGE_CONSTRAINTS.MAX_IMAGES_ALLOWED) {
          toast.error(
            `You can upload a maximum of ${IMAGE_CONSTRAINTS.MAX_IMAGES_ALLOWED} images per update. Please remove some images to continue.`
          );
        } else {
          setImages(newImages);
          const existingPreviews = existingImageCids.map((cid) => `${ipfsServiceURL}/${cid}`);
          const newFilePreviews = newImages.map((file) => URL.createObjectURL(file));
          setPreviews([...existingPreviews, ...newFilePreviews]);

          Promise.all(
            newImages.map((file) => {
              return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              });
            })
          ).then((base64Images) => {
            onImagesUpdate(base64Images, existingImageCids);
          });

          toast.success(`${validFiles.length} image${validFiles.length > 1 ? 's' : ''} uploaded successfully!`);
        }
      }
    } catch (err) {
      toast.error('Failed to process images. Please try again.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (idx: number) => {
    const existingCount = existingImageCids.length;

    if (idx < existingCount) {
      const newExistingCids = existingImageCids.filter((_, i) => i !== idx);
      setExistingImageCids(newExistingCids);
      onImagesUpdate([], newExistingCids);
    } else {
      const newImageIdx = idx - existingCount;
      URL.revokeObjectURL(previews[idx]);
      const newImages = images.filter((_, i) => i !== newImageIdx);
      setImages(newImages);

      Promise.all(
        newImages.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      ).then((base64Images) => {
        onImagesUpdate(base64Images, existingImageCids);
      });
    }

    const newPreviews = previews.filter((_, i) => i !== idx);
    setPreviews(newPreviews);
  };

  const handleRemoveAll = () => {
    const existingCount = existingImageCids.length;
    previews.slice(existingCount).forEach((preview) => URL.revokeObjectURL(preview));

    setImages([]);
    setPreviews([]);
    setExistingImageCids([]);
    onImagesUpdate([], []);
    toast.success('All images removed');
  };

  return {
    images,
    previews,
    existingImageCids,
    setExistingImageCids,
    isCompressing,
    totalSize,
    maxTotalSize,
    handleImageChange,
    handleRemoveImage,
    handleRemoveAll,
    setExistingSize,
    initializeExistingImages,
  };
};
