import { CampaignBasics } from './campaign-basics';
import { GoalsAndTiming } from './goals-and-timing';

const CampaignForm = () => {
  return (
    <form className="space-y-10">
      <CampaignBasics />
      <GoalsAndTiming />
    </form>
  );
};

export { CampaignForm };
