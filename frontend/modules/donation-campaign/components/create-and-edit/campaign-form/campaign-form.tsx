import { CampaignBasics } from './campaign-basics';
import { DonationWallet } from './donation-wallet';
import { GoalsAndTiming } from './goals-and-timing';

interface CampaignFormProps {
  type?: 'create' | 'edit';
}
const CampaignForm = ({ type = 'create' }: CampaignFormProps) => {
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
