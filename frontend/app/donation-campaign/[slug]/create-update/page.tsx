import { CreateUpdate } from '@/modules/donation-campaign/components/campaign-updates';
import type { Metadata } from 'next';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Create Campaign Update',
};

export default function CreateCampaignUpdatePage() {
  return (
    <ProtectedRoute>
      <CreateUpdate />
    </ProtectedRoute>
  );
}
