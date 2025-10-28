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
const getDaysRemaining = (dateString: string): number => {
  if (!dateString) return 0;

  const targetDate = new Date(dateString);
  const now = new Date();

  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};
const truncateWalletAddress = (address: string, chars = 6) => {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};
export { getCampaignStatusLabel, getCampaignStatusVariant, truncateWalletAddress, getDaysRemaining };
