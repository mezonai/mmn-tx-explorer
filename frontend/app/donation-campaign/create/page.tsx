import type { Metadata } from 'next';

import { CreateCampaign } from '@/modules/donation-campaign/components';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Create Campaign',
};

export default function CreateCampaignPage() {
  return (
    <ProtectedRoute title={String(metadata.title)}>
      <CreateCampaign />
    </ProtectedRoute>
  );
}
