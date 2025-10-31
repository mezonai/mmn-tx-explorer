import { APP_CONFIG } from '@/configs/app.config';
import { memo } from 'react';

const CampaignEditor = memo(function CampaignCreator() {
  return (
    <>
      <p className="text-brand-primary text-xs font-semibold tracking-[0.3em] uppercase">Campaign Edit</p>
      <h1 className="text-foreground mt-4 text-3xl font-semibold sm:text-4xl">Edit donation campaign</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
        Changes made here will update the live campaign on Mezon {APP_CONFIG.CHAIN_SYMBOL}.
      </p>
    </>
  );
});

export { CampaignEditor };
