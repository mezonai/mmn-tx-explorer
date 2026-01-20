import { DonationCampaignService } from '../api';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';

export const useDonationFeedPostDetail = (tx_hash: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DONATION_FEED_POST_DETAIL, tx_hash],
    queryFn: () => DonationCampaignService.getDonationFeedPostDetail(tx_hash),
    enabled: !!tx_hash,
  });
};
