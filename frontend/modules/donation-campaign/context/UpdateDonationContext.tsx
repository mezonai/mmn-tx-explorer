import { DonationUpdateForm, DonationCampaign, IDonationFeed } from '../type';
import { createContext, ReactNode, useState, useContext } from 'react';
import { useUploadDonationImages } from '../hooks';
import { mmnClient } from '@/modules/auth';
import { ETransferType } from '@/modules/transaction';
import { useUser, useKeypair, useZkProof } from '@/providers';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';

const INITIAL_FORM: DonationUpdateForm = {
  title: '',
  description: '',
  reference_tx_hashes: [],
  images: [],
};

interface DonationUpdateValidation {
  isTitle: boolean;
  isDescription: boolean;
}

interface CreateDonationUpdateContextType {
  form: DonationUpdateForm;
  setForm: (form: DonationUpdateForm) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  validation: DonationUpdateValidation;
  handleSubmit: () => void;
}

function validateForm(form: DonationUpdateForm): DonationUpdateValidation {
  const trimmedTitle = String(form.title ?? '').trim();
  const isTitleValid = trimmedTitle.length > 0 && !/^\d+$/.test(trimmedTitle);

  const trimmedDescription = String(form.description ?? '').trim();
  const isDescriptionValid = trimmedDescription.length > 0;

  return {
    isTitle: isTitleValid,
    isDescription: isDescriptionValid,
  };
}

const CreateDonationUpdateContext = createContext<CreateDonationUpdateContextType | undefined>(undefined);

interface CreateDonationUpdateProviderProps {
  updatePost?: IDonationFeed;
  campaign: DonationCampaign;
  children: ReactNode;
}

export function UpdateDonationProvider({ updatePost, campaign, children }: CreateDonationUpdateProviderProps) {
  const [form, setForm] = useState<DonationUpdateForm>(INITIAL_FORM);
  const uploadImagesMutation = useUploadDonationImages();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const validation = validateForm(form);
  const { user } = useUser();
  const { keypair } = useKeypair();
  const { zkProof } = useZkProof();

  const recipientAddress = campaign.donation_wallet;
  const publicKey = keypair?.publicKey;
  const privateKey = keypair?.privateKey;

  const handleSubmit = async () => {
    try {
      setIsSaving(true);

      let imageCids: string[] = [];

      if (form.images && form.images.length > 0) {
        const filePromises = form.images.map(async (base64, index) => {
          const response = await fetch(base64);
          const blob = await response.blob();
          const mimeType = base64.split(',')[0].split(':')[1].split(';')[0];
          const extension = mimeType.split('/')[1];
          return new File([blob], `image-${index}.${extension}`, { type: mimeType });
        });
        const files = await Promise.all(filePromises);
        const ipfs_images = await uploadImagesMutation.mutateAsync({ files });
        const newCids = ipfs_images.files.map((file: { file_cid: any }) => file.file_cid);
        imageCids = [...newCids];
      }

      if (form.existingImageCids && form.existingImageCids.length > 0) {
        imageCids = [...form.existingImageCids, ...imageCids];
      }

      const nonceResponse = await mmnClient.getCurrentNonce(user?.id || '');

      const extraInfo = {
        type: ETransferType.DonationFeedCampaign,
        title: form.title,
        description: form.description,
        image_cids: imageCids,
        reference_tx_hashes: form.reference_tx_hashes,
        ...(updatePost && {
          parent_hash: updatePost.tx_hash,
          root_hash: updatePost.root_hash || updatePost.tx_hash,
        }),
      };

      const updateResponse = await mmnClient.postDonationCampaignFeed({
        sender: user?.walletAddress || '',
        recipient: recipientAddress,
        amount: '0',
        nonce: Number(nonceResponse.nonce) + 1,
        publicKey: publicKey || '',
        privateKey: privateKey || '',
        zkProof: zkProof?.proof || '',
        zkPub: zkProof?.public_input || '',
        extraInfo,
      });

      if (updateResponse.ok) {
        toast.success(updatePost ? 'Update edited successfully.' : 'Update submitted successfully.');
        router.push(ROUTES.CAMPAIGN(campaign.slug));
      } else {
        toast.error('Failed to submit update.');
      }
    } catch (error) {
      toast.error('Failed to submit update.');
    } finally {
      setIsSaving(false);
    }
  };

  const contextValue: CreateDonationUpdateContextType = {
    form,
    setForm,
    isSaving,
    setIsSaving,
    validation,
    handleSubmit,
  };

  return <CreateDonationUpdateContext.Provider value={contextValue}>{children}</CreateDonationUpdateContext.Provider>;
}

export function useCreateDonationUpdateContext() {
  const context = useContext(CreateDonationUpdateContext);
  if (!context) {
    throw new Error('useCreateDonationUpdateContext must be used within a CreateDonationUpdateProvider');
  }
  return context;
}
