import { useState, ChangeEvent, useEffect } from 'react';
import { compressImage, formatFileSize } from '@/utils';
import { toast } from 'sonner';
import { useCreateDonationUpdateContext } from '../context';
import heic2any from 'heic2any';
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

interface UseUpdateFormProps {
  updatePost?: IDonationFeed;
}

export const useUpdateForm = ({ updatePost }: UseUpdateFormProps = {}) => {
  const { form, setForm, validation, handleSubmit, isSaving } = useCreateDonationUpdateContext();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const maxTotalSize = MAX_IMAGES_SIZE * 1024 * 1024;

  // Initialize form with existing data if editing
  useEffect(() => {
    if (updatePost) {
      setForm({
        ...form,
        title: updatePost.title,
        description: updatePost.description,
        images: updatePost.image_cids,
      });

      if (updatePost.image_cids && updatePost.image_cids.length > 0) {
        setPreviews(updatePost.image_cids.map((cid) => `${ipfsServiceURL}/${cid}`));
      }
    }
  }, [updatePost]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // Validate file types - check both MIME type and extension for HEIC
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
        const newTotalSize = newImages.reduce((sum, img) => sum + img.size, 0);

        if (newTotalSize > maxTotalSize) {
          toast.error(
            `Total size would exceed ${MAX_IMAGES_SIZE} ${UNIT} limit. Current: ${formatFileSize(totalSize)}. Try uploading fewer or smaller images.`
          );
        } else {
          setImages(newImages);
          setPreviews(newImages.map((file) => URL.createObjectURL(file)));

          // Convert files to base64 for form storage
          Promise.all(
            newImages.map((file) => {
              return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              });
            })
          ).then((base64Images) => {
            setForm({ ...form, images: base64Images });
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
    URL.revokeObjectURL(previews[idx]);

    const newImages = images.filter((_, i) => i !== idx);
    setImages(newImages);
    const newPreviews = previews.filter((_, i) => i !== idx);
    setPreviews(newPreviews);

    // Update form with base64 strings
    Promise.all(
      newImages.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    ).then((base64Images) => {
      setForm({ ...form, images: base64Images });
    });
  };

  const handleRemoveAll = () => {
    previews.forEach((preview) => URL.revokeObjectURL(preview));

    setImages([]);
    setPreviews([]);
    setForm({ ...form, images: [] });
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
  };
};
