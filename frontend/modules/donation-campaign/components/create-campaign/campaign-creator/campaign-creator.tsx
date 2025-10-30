import { APP_CONFIG } from '@/configs/app.config';
import { memo } from 'react';

const CampaignCreator = memo(function CampaignCreator() {
  return (
    <>
      <p className="text-brand-primary text-xs font-semibold tracking-[0.3em] uppercase">Campaign creator</p>
      <h1 className="text-foreground mt-4 text-3xl font-semibold sm:text-4xl">Create a new donation campaign</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
        Provide the key narrative, upload media, and issue a dedicated {APP_CONFIG.CHAIN_SYMBOL} wallet so the community
        can follow every donation. Drafts are auto-saved and you can publish whenever stakeholders approve.
      </p>
    </>
  );
});

export { CampaignCreator };
