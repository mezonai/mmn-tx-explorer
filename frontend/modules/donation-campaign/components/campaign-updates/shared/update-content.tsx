'use client';
import { PageHeader } from '@/components/shared';
import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { useParams } from 'next/navigation';
import { UpdateForm } from './update-form';
import { useUpdateForm } from '../../../hooks';

export const CreateUpdateContent = () => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ? String(params.slug) : '';

  const breadcrumbs: IBreadcrumb[] = [
    { label: 'Donation campaign', href: ROUTES.DONATION_CAMPAIGN },
    { label: 'Campaign Details', href: ROUTES.CAMPAIGN(slug) },
    { label: 'Create Campaign Update', href: '#' },
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
  } = useUpdateForm();

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
