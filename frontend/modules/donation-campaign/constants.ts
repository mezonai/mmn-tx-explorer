export const DONATION_ENDPOINTS = {
  CAMPAIGNS: '/api/v1/campaigns',
  CAMPAIGN_BY_ID: (id: string) => `/api/v1/campaigns/${id}`,
  CAMPAIGN_BY_SLUG: (slug: string) => `/api/v1/campaigns/slug/${slug}`,
  STATS: '/api/v1/stats/campaign',
  ACTIVATE_CAMPAIGN: (id: string) => `/api/v1/admin/campaigns/${id}/activate`,
  CLOSE_CAMPAIGN: (id: string) => `/api/v1/admin/campaigns/${id}/close`,
  CREATE_AND_PUBLISH_CAMPAIGN: '/api/v1/admin/campaigns/create-active',
  CREATE_CAMPAIGN: '/api/v1/admin/campaigns',
  EDIT_CAMPAIGN: (id: string) => `/api/v1/admin/campaigns/${id}`,
  DELETE_CAMPAIGN: (id: string) => `/api/v1/admin/campaigns/${id}`,
  DONATIONS: '/donations',
  MY_DONATIONS: '/donations/my-donations',
  PUBLISH_CAMPAIGN: (id: string) => `/api/v1/campaigns/${id}/activate`,
  TOP_CONTRIBUTOR: (id: string) => `/api/v1/campaigns/${id}/top-contributors`,
  REFRESH_CAMPAIGN_RAISED: (id: string) => `/api/v1/campaigns/${id}/sync`,
} as const;

export const QUERY_KEYS = {
  CAMPAIGNS: 'campaigns',
  TOP_CAMPAIGNS: 'top-campaigns',
  CAMPAIGN: 'campaign',
  CAMPAIGN_STATS: 'campaign-stats',
  USER_DONATIONS: 'user-donations',
  TOP_CONTRIBUTOR: 'top-contributors',
} as const;
