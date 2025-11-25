import { ECampaignStatus } from './type';

const getCampaignStatusLabel = (status: ECampaignStatus) => {
  switch (status) {
    case ECampaignStatus.Active:
      return 'Active';
    case ECampaignStatus.Draft:
      return 'Draft';
    case ECampaignStatus.Closed:
      return 'Closed';
    default:
      return 'Unknown';
  }
};

const getCampaignStatusVariant = (status: ECampaignStatus) => {
  switch (status) {
    case ECampaignStatus.Active:
      return `success`;
    case ECampaignStatus.Draft:
      return `warning`;
    case ECampaignStatus.Closed:
      return `error`;
    default:
      return `default`;
  }
};
const truncateWalletAddress = (address: string, chars = 6) => {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};
export { getCampaignStatusLabel, getCampaignStatusVariant, truncateWalletAddress };
