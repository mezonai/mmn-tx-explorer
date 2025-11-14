import type { Metadata } from 'next';

import { EditCampaign } from '@/modules/donation-campaign/components';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Edit Campaign',
};

export default function EditCampaignPage() {
  return (
    <ProtectedRoute title={String(metadata.title)}>
      <EditCampaign />
    </ProtectedRoute>
  );
}
