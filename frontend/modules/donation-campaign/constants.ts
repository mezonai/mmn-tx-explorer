export const DONATION_ENDPOINTS = {
  CAMPAIGNS: '/api/v1/campaigns',
  CAMPAIGN_BY_ID: (id: string) => `/api/v1/campaigns/${id}`,
  STATS: '/api/v1/stats/campaign',
  DONATIONS: '/donations',
  MY_DONATIONS: '/donations/my-donations',
} as const;

export const QUERY_KEYS = {
  CAMPAIGNS: 'campaigns',
  CAMPAIGN: 'campaign',
  CAMPAIGN_STATS: 'campaign-stats',
  USER_DONATIONS: 'user-donations',
} as const;
