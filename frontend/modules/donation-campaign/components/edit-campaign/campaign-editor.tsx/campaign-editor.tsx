import { APP_CONFIG } from '@/configs/app.config';
import { memo } from 'react';
import { PageHeader } from '@/components/shared';

const CampaignEditor = memo(function CampaignCreator() {
  return (
    <>
      <PageHeader
        title="Edit Campaign"
        header="Edit donation campaign"
        description={`Changes made here will update the live campaign on Mezon ${APP_CONFIG.CHAIN_SYMBOL}.`}
      />
    </>
  );
});

export { CampaignEditor };
