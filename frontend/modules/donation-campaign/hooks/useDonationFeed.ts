import { useInfiniteQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';
import { DonationFeedParams } from '../type';

export const useDonationFeed = (address: string, params?: Omit<DonationFeedParams, 'timestamp_lt'>) => {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.DONATION_FEED, address, params],
    queryFn: ({ pageParam }) => {
      const queryParams: DonationFeedParams = {
        ...params,
        limit: params?.limit || 10,
      };

      if (pageParam) {
        queryParams.timestamp_lt = pageParam;
      }

      return DonationCampaignService.getDonationFeed({ address, params: queryParams });
    },
    getNextPageParam: (lastPage) => {
      const feeds = lastPage.data;
      if (!feeds || feeds.length === 0) return undefined;

      const lastFeed = feeds[feeds.length - 1];
      const timestamp = new Date(lastFeed.root_created_at).toISOString();

      return feeds.length === (params?.limit || 10) ? timestamp : undefined;
    },
    initialPageParam: undefined as string | undefined,
  });
  const donationFeed = data?.pages.flatMap((page) => page.data) || [];

  return {
    donationFeed,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
