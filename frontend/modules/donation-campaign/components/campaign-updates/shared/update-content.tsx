'use client';
import { PageHeader } from '@/components/shared';
import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { useState, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import { compressImage, formatFileSize } from '@/utils';
import { toast } from 'sonner';
import { useCreateDonationUpdateContext } from '../../../context';
import { UpdateForm } from './update-form';

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

export const CreateUpdateContent = () => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ? String(params.slug) : '';
  const { form, setForm, validation, handleSubmit, isSaving } = useCreateDonationUpdateContext();

  const breadcrumbs: IBreadcrumb[] = [
    { label: 'Donation campaign', href: ROUTES.DONATION_CAMPAIGN },
    { label: 'Campaign Details', href: ROUTES.CAMPAIGN(slug) },
    { label: 'Create Campaign Update', href: '#' },
  ];
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const maxTotalSize = MAX_IMAGES_SIZE * 1024 * 1024;

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
            const compressed = await compressImage(file);
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

  return (
    <div className="space-y-6">
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      <PageHeader
        title="Campaign Update"
        header="Create Campaign Update"
        description="Share the latest news and progress of your donation campaign with your supporters."
      />
      <div className="my-3 flex w-full flex-col items-center justify-center py-5">
        <UpdateForm
          form={form}
          setForm={setForm}
          validation={validation}
          images={images}
          previews={previews}
          isCompressing={isCompressing}
          isSaving={isSaving}
          handleImageChange={handleImageChange}
          handleRemoveImage={handleRemoveImage}
          handleRemoveAll={handleRemoveAll}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};
