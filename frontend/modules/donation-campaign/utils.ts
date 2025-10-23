import { CampaignStatus } from './type';

const getCampaignStatusVariant = (status: CampaignStatus) => {
  switch (status) {
    case CampaignStatus.Active:
      return `success`;
    case CampaignStatus.Draft:
      return `warning`;
    case CampaignStatus.Closed:
      return `error`;
    default:
      return `default`;
  }
};

export { getCampaignStatusVariant };
