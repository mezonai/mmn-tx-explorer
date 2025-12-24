import { useQuery } from "@tanstack/react-query";
import { DonationCampaignService } from "../api";
import { QUERY_KEYS } from "../constants";

export const useDonationFeedHistory = (root_hash: string) => {
  const {
    data: donationFeedHistoryResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.DONATION_FEED_HISTORY, root_hash],
    queryFn: () => DonationCampaignService.donationFeedHistory(root_hash),
  });
  return {
    donationFeedHistoryResponse,
    isLoading,
    error,
  };
};