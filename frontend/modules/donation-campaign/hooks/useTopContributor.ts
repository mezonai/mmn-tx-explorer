import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export function useTopContributor({ params, slug }: { slug: string; params: { limit: number } }) {
  return useQuery({
    queryKey: [QUERY_KEYS.TOP_CONTRIBUTOR, slug, params],
    queryFn: () => DonationCampaignService.getTopContributorBySlug({ slug, params }),
    enabled: !!slug,
  });
}
