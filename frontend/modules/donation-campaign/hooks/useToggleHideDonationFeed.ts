import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DonationCampaignService } from "../api";
import { QUERY_KEYS } from "../constants";
import { toast } from "sonner";

export const useToggleHideDonationFeed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ root_hash, visible }: { root_hash: string; visible: boolean }) =>
      DonationCampaignService.toggleHideDonationFeed(root_hash, visible),
    onSuccess: (_data, { visible }) => {
      // Invalidate both the history and the main feed query
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DONATION_FEED] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DONATION_FEED_HISTORY] });
      toast.success(visible ? 'Post unhidden successfully' : 'Post hidden successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update post visibility');
    },
  });
};