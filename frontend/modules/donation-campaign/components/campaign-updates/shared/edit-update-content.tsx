'use client';
import { PageHeader } from '@/components/shared';
import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { useParams } from 'next/navigation';
import { UpdateForm } from './update-form';
import { IDonationFeed } from '../../../type';
import { useUpdateForm } from '../../../hooks';

interface EditUpdateContentProps {
  updatePost: IDonationFeed;
}

export const EditUpdateContent = ({ updatePost }: EditUpdateContentProps) => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ? String(params.slug) : '';

  const breadcrumbs: IBreadcrumb[] = [
    { label: 'Donation campaign', href: ROUTES.DONATION_CAMPAIGN },
    { label: 'Campaign Details', href: ROUTES.CAMPAIGN(slug) },
    { label: 'Edit Campaign Update', href: '#' },
  ];

  const {
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
  } = useUpdateForm({ updatePost });

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
          setExistingSize={setExistingSize}
        />
      </div>
    </div>
  );
};
