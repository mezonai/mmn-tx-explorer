import { useQuery } from "@tanstack/react-query";
import { DonationCampaignService } from "../api";
import { QUERY_KEYS } from "../constants";

export const useDonationFeed = (address: string) => {
  const {
    data: donationFeedResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.DONATION_FEED, address],
    queryFn: () => DonationCampaignService.getDonationFeed(address),
  });
  return {
    donationFeed: donationFeedResponse?.data || [],
    meta: donationFeedResponse?.meta,
    isLoading,
    error,
  };
}
