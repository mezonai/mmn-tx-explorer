import { UUID } from "crypto";

export const ROUTES = {
  HOME: '/',

  BLOCK: (number: number, queryParams?: string) => `/blocks/${number}${queryParams ? `?${queryParams}` : ''}`,
  BLOCKS: '/blocks',

  CREATE_CAMPAIGN: '/donation-campaign/create',
  CAMPAIGN_EDIT: (slug: string) => `/donation-campaign/${slug}/edit`,
  CAMPAIGN: (slug: string) => `/donation-campaign/${slug}`,
  DONATION_CAMPAIGN: '/donation-campaign',
  CREATE_DONATION_UPDATE: (slug: string) => `/donation-campaign/${slug}/create-update`,

  LUCKY_MONEY: '/lucky-money',
  CREATE_LUCKY_MONEY: '/lucky-money/create',
  LUCKY_MONEY_DETAIL: (id: UUID) => `/lucky-money/${id}`,

  PENDING_TRANSACTION: (hash: string) => `/transactions/pending/${hash}`,
  TRANSACTION: (hash: string, queryParams?: string) => `/transactions/${hash}${queryParams ? `?${queryParams}` : ''}`,
  TRANSACTIONS: '/transactions',
  TRANSFER: '/transfer',

  WALLET: (address: string, queryParams?: string) => `/wallets/${address}${queryParams ? `?${queryParams}` : ''}`,
  WALLETS: '/wallets',

  COBAR: '/cobar',
  DEVELOPER: '/developer',
  LI_XI: '/li-xi',
  MEZON_GAME: '/mezon-game',
  PROFILE: '/profile',
  STAKE: '/stake',
  SWAP: '/swap',
  EXPORT_CSV: '/export-transactions-csv',
} as const;
