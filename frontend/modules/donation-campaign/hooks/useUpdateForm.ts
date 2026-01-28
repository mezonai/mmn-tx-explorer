import { useEffect } from 'react';
import { toast } from 'sonner';
import { useCreateDonationUpdateContext } from '../context';
import { IDonationFeed } from '../type';
import { UploadDonationImage } from '../services';

interface UseUpdateFormProps {
  updatePost?: IDonationFeed;
}

export const useUpdateForm = ({ updatePost }: UseUpdateFormProps = {}) => {
  const { form, setForm, validation, handleSubmit, isSaving } = useCreateDonationUpdateContext();

  const {
    images,
    previews,
    isCompressing,
    handleImageChange,
    handleRemoveImage,
    handleRemoveAll,
    setExistingSize,
    initializeExistingImages,
  } = UploadDonationImage({
    onImagesUpdate: (base64Images, existingImageCids) => {
      setForm({ ...form, images: base64Images, existingImageCids: existingImageCids });
    },
    initialExistingCids: updatePost?.image_cids || [],
  });

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
        initializeExistingImages(updatePost.image_cids);
      }
    }
  }, [updatePost, setForm]);

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
  };
};
