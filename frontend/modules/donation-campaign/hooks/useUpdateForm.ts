import { useState, ChangeEvent, useEffect } from 'react';
import { compressImage, formatFileSize } from '@/utils';
import { toast } from 'sonner';
import { useCreateDonationUpdateContext } from '../context';
import { IDonationFeed } from '../type';
import { ipfsServiceURL } from '@/service';

const UNIT = 'MB';
const MAX_IMAGES_SIZE = 20;
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
];
const MAX_IMAGES_ALLOWED = 50;

interface UseUpdateFormProps {
  updatePost?: IDonationFeed;
}

export const useUpdateForm = ({ updatePost }: UseUpdateFormProps = {}) => {
  const { form, setForm, validation, handleSubmit, isSaving } = useCreateDonationUpdateContext();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImageCids, setExistingImageCids] = useState<string[]>([]);
  const [existingImagesSize, setExistingImagesSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);

  const newImagesSize = images.reduce((sum, img) => sum + img.size, 0);
  const totalSize = newImagesSize + existingImagesSize;
  const maxTotalSize = MAX_IMAGES_SIZE * 1024 * 1024;

  const setExistingSize = (size: number) => {
    setExistingImagesSize(size);
  };

  useEffect(() => {
    if (updatePost) {
      setForm({
        title: updatePost.title,
        description: updatePost.description,
        reference_tx_hashes: updatePost.reference_tx_hashes || [],
        images: [],
        existingImageCids: updatePost.image_cids || [],
      });

      if (updatePost.image_cids && updatePost.image_cids.length > 0) {
        setExistingImageCids(updatePost.image_cids);
        setPreviews(updatePost.image_cids.map((cid) => `${ipfsServiceURL}/${cid}`));
      }
    }
  }, [updatePost, setForm]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const invalidFiles = files.filter((file) => {
      const isValidMimeType = ALLOWED_IMAGE_TYPES.includes(file.type);
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

    setIsCompressing(true);
    try {
      const availableSize = maxTotalSize - totalSize;

      if (availableSize <= 0) {
        toast.error(`Total size limit reached (${MAX_IMAGES_SIZE} ${UNIT} for all images).`);
        setIsCompressing(false);
        e.target.value = '';
        return;
      }

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
              } catch (heicError) {
                toast.error(`Failed to convert HEIC file: ${file.name}`);
                return null;
              }
            }

            const compressed = await compressImage(processedFile);
            return compressed;
          } catch (err) {
            toast.error(`Failed to compress ${file.name}. Please try a different image.`);
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
            `Total size would exceed ${MAX_IMAGES_SIZE} ${UNIT} limit. Current: ${formatFileSize(totalSize)}. Try uploading fewer or smaller images.`
          );
        } else if (newImages.length + existingImageCids.length > MAX_IMAGES_ALLOWED) {
          toast.error(
            `You can upload a maximum of ${MAX_IMAGES_ALLOWED} images per update. Please remove some images to continue.`
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
            setForm({ ...form, images: base64Images, existingImageCids });
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
      setForm({ ...form, existingImageCids: newExistingCids });
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
        setForm({ ...form, images: base64Images, existingImageCids });
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
    setForm({ ...form, images: [], existingImageCids: [] });
    toast.success('All images removed');
  };

  const onSubmit = () => {
    if (!validation.isTitle) {
      toast.error('Please enter a valid title');
      return;
    }
    if (!validation.isDescription) {
      toast.error('Please enter a description');
      return;
    }
    handleSubmit();
  };

  return {
    form,
    setForm,
    validation,
    images,
    previews,
    isCompressing,
    isSaving,
    handleImageChange,
    handleRemoveImage,
    handleRemoveAll,
    onSubmit,
    setExistingSize,
    unit: UNIT,
    maxSize: MAX_IMAGES_SIZE,
    maxImagesAllowed: MAX_IMAGES_ALLOWED,
  };
};
