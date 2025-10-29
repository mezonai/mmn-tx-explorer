import { CampaignBasics } from './campaign-basics';
import { DonationWallet } from './donation-wallet';
import { GoalsAndTiming } from './goals-and-timing';

const CampaignForm = () => {
  return (
    <form className="space-y-10">
      <CampaignBasics />

      <GoalsAndTiming />

      <DonationWallet />
    </form>
  );
};

export { CampaignForm };
