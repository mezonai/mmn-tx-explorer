'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChangeEvent, useEffect, useState } from 'react';
import { ipfsServiceURL } from '@/service';
import { UpdateFormHeader } from './update-form-header';
import { Basicfield } from './basic-field';
import { UploadImages } from './upload-images';
import { FormSubmit } from './form-submit';
import { ReferenceTx } from './reference-tx';

interface UpdateFormProps {
  form: {
    title: string;
    description: string;
    reference_tx_hashes: string[];
    images: string[];
  };
  setForm: (form: { title: string; description: string; reference_tx_hashes: string[]; images: string[] }) => void;
  validation: {
    isTitle: boolean;
    isDescription: boolean;
  };
  images: File[];
  previews: string[];
  isCompressing: boolean;
  isSaving: boolean;
  isFetchingSizes?: boolean;
  totalSize?: number;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: (idx: number) => void;
  handleRemoveAll: () => void;
  onSubmit: () => void;
  isEdit?: boolean;
  setExistingSize?: (size: number) => void;
}

const getImagesize = async (imageCid: string): Promise<number> => {
  try {
    const response = await fetch(`${ipfsServiceURL}/${imageCid}`);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.error('Error fetching image size for CID:', imageCid, error);
    return 0;
  }
};

export const UpdateForm = ({
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
  isEdit = false,
  setExistingSize,
}: UpdateFormProps) => {
  const [existingImagesSize, setExistingImagesSize] = useState(0);
  const [isFetchingLocalSizes, setIsFetchingLocalSizes] = useState(false);

  useEffect(() => {
    const existingCids = (form as any).existingImageCids || [];
    if (isEdit && existingCids.length > 0) {
      const fetchSizes = async () => {
        setIsFetchingLocalSizes(true);
        const sizes = await Promise.all(existingCids.map((cid: string) => getImagesize(cid)));
        const total = sizes.reduce((sum, size) => sum + size, 0);
        setExistingImagesSize(total);
        setExistingSize?.(total);
        setIsFetchingLocalSizes(false);
      };
      fetchSizes();
    } else {
      setExistingImagesSize(0);
      setExistingSize?.(0);
    }
  }, [(form as any).existingImageCids, isEdit]);

  const newImagesSize = images.reduce((sum, img) => sum + img.size, 0);
  const totalSize = isEdit ? existingImagesSize + newImagesSize : newImagesSize;

  const totalImagesCount = isEdit ? ((form as any).existingImageCids?.length || 0) + images.length : images.length;

  return (
    <Card className="border-primary/40 bg-card shadow-brand-primary/10 w-full max-w-[700px] rounded-3xl border p-3 shadow-lg dark:border-white/10">
      <UpdateFormHeader />
      <CardContent className="text-brand-primary space-y-5 p-5 text-left">
        <Basicfield form={form} setForm={setForm} />
        <ReferenceTx form={form} setForm={setForm} />
        <Separator className="my-4 w-full" />
        <UploadImages
          previews={previews}
          handleRemoveImage={handleRemoveImage}
          handleRemoveAll={handleRemoveAll}
          handleImageChange={handleImageChange}
          isCompressing={isCompressing}
          totalSize={totalSize}
          totalImagesCount={totalImagesCount}
          isFetchingLocalSizes={isFetchingLocalSizes}
        />
        <Separator className="my-4 w-full" />
        <FormSubmit
          isSaving={isSaving}
          validation={validation}
          onSubmit={onSubmit}
          isEdit={isEdit}
          totalSize={totalSize}
        />
      </CardContent>
    </Card>
  );
};
