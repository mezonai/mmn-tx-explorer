import { APP_CONFIG } from '@/configs/app.config';
import { memo } from 'react';
import { PageHeader } from '@/components/shared';
import { CampaignModeProps } from '../types';

const CampaignHeader = memo(function CampaignHeader({ type = 'create' }: CampaignModeProps) {
  return (
    <>
      {type === 'create' && (
        <PageHeader
          title="Create Campaign"
          header="Create a new donation campaign"
          description={`Start a new donation campaign on Mezon ${APP_CONFIG.CHAIN_SYMBOL} to raise funds for your cause.`}
        />
      )}
      {type === 'edit' &&
      <PageHeader
        title="Edit Campaign"
        header="Edit donation campaign"
        description={`Changes made here will update the live campaign on Mezon ${APP_CONFIG.CHAIN_SYMBOL}.`}
      />
      }
    </>
  );
});

export { CampaignHeader };
