import { CampaignStatus, DonationCampaign } from './type';

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

const timeSort = {
  newest: (a: DonationCampaign, b: DonationCampaign) => {
    const aTime = new Date(a.created_at ?? '').getTime();
    const bTime = new Date(b.created_at ?? '').getTime();

    if (isNaN(aTime) && isNaN(bTime)) return 0;
    if (isNaN(aTime)) return 1;
    if (isNaN(bTime)) return -1;

    return bTime - aTime;
  },

  oldest: (a: DonationCampaign, b: DonationCampaign) => {
    const aTime = new Date(a.created_at ?? '').getTime();
    const bTime = new Date(b.created_at ?? '').getTime();

    if (isNaN(aTime) && isNaN(bTime)) return 0;
    if (isNaN(aTime)) return 1;
    if (isNaN(bTime)) return -1;

    return aTime - bTime;
  },
};

function sortCampaigns(campaigns: DonationCampaign[], sortBy: keyof typeof timeSort = 'newest') {
  if (!Array.isArray(campaigns)) return [];

  const sortFn = timeSort[sortBy] ?? timeSort.newest;
  return [...campaigns].sort(sortFn);
}

export { getCampaignStatusVariant, timeSort, sortCampaigns };
