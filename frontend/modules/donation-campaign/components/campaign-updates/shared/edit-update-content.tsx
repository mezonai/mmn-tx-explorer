'use client';
import { PageHeader } from '@/components/shared';
import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { useState, ChangeEvent, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { compressImage, formatFileSize } from '@/utils';
import { toast } from 'sonner';
import { useCreateDonationUpdateContext } from '../../../context';
import { UpdateForm } from './update-form';
import { IDonationFeed } from '../../../type';
import { ipfsServiceURL } from '@/service';

const UNIT = 'MB';
const MAX_IMAGES_SIZE = 5;

interface EditUpdateContentProps {
  updatePost: IDonationFeed;
}

export const EditUpdateContent = ({ updatePost }: EditUpdateContentProps) => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ? String(params.slug) : '';
  const { form, setForm, validation, handleSubmit, isSaving } = useCreateDonationUpdateContext();

  const breadcrumbs: IBreadcrumb[] = [
    { label: 'Donation campaign', href: ROUTES.DONATION_CAMPAIGN },
    { label: 'Campaign Details', href: ROUTES.CAMPAIGN(slug) },
    { label: 'Edit Campaign Update', href: '#' },
  ];
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    setForm({
      title: updatePost.title,
      description: updatePost.description,
      images: [],
      parent_hash: updatePost.tx_hash,
      root_hash: updatePost.root_hash || updatePost.tx_hash,
    });
    
    if (updatePost.image_cids && updatePost.image_cids.length > 0) {
      setPreviews(updatePost.image_cids.map(cid => `${ipfsServiceURL}/${cid}`));
    }
  }, [updatePost.id]); 

  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const maxTotalSize = MAX_IMAGES_SIZE * 1024 * 1024;

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

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
        title="Edit Campaign Update"
        header="Edit Campaign Update"
        description="Update the information and progress of your donation campaign."
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
          isEdit={true}
        />
      </div>
    </div>
  );
};
