import { CampaignBasics } from './campaign-basics';
import { DonationWallet } from './donation-wallet';
import { GoalsAndTiming } from './goals-and-timing';
import { CampaignModeProps } from '../types';

const CampaignForm = ({ type = 'create' }: CampaignModeProps) => {
  return (
    <form className="space-y-10">
      {type === 'create' && (
        <>
          <CampaignBasics />
          <GoalsAndTiming />
          <DonationWallet />
        </>
      )}
      {type === 'edit' && (
        <>
          <CampaignBasics disableName />
          <GoalsAndTiming disableOwner />
        </>
      )}
    </form>
  );
};

export { CampaignForm };
