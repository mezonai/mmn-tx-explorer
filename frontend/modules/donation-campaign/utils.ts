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
export { getCampaignStatusVariant, getDaysRemaining, truncateWalletAddress };
