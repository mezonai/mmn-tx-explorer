import { useQuery } from "@tanstack/react-query";
import { DonationCampaignService } from "../api";
import { QUERY_KEYS } from "../constants";

export const useLatestDonationUpdate = (address: string) => {
   return useQuery({
     queryKey: [QUERY_KEYS.LATEST_DONATION_UPDATE, address, 'latest-update'],
     queryFn: () => DonationCampaignService.getLatestDonationUpdate(address),
   });
}