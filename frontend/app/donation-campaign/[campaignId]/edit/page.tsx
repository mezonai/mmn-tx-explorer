import type { Metadata } from 'next';

import { UpdateCampaign } from '@/modules/donation-campaign/components';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Update Campaign',
};

export default function UpdateCampaignPage() {
  return (
    <ProtectedRoute title={String(metadata.title)}>
      <UpdateCampaign />
    </ProtectedRoute>
  );
}
