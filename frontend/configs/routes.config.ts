import { UUID } from 'crypto';

export const ROUTES = {
  BLOCK: (number: number, queryParams?: string) => `/blocks/${number}${queryParams ? `?${queryParams}` : ''}`,
  BLOCKS: '/blocks',
  CAMPAIGN_EDIT: (slug: string) => `/donation-campaign/${slug}/edit`,
  CAMPAIGN: (slug: string) => `/donation-campaign/${slug}`,
  COBAR: '/cobar',
  CREATE_CAMPAIGN: '/donation-campaign/create',
  DEVELOPER: '/developer',
  DONATION_CAMPAIGN: '/donation-campaign',
  HOME: '/',
  LUCKY_MONEY: '/lucky-money',
  CREATE_LUCKY_MONEY: '/lucky-money/create',
  LUCKY_MONEY_DETAIL: (id: UUID) => `/lucky-money/${id}`,
  LUCKY_MONEY_CLAIM: (id: UUID) => `/lucky-money/${id}/claim`,
  MEZON_GAME: '/mezon-game',
  PENDING_TRANSACTION: (hash: string) => `/transactions/pending/${hash}`,
  PROFILE: '/profile',
  P2P: '/p2p',
  P2P_TRADING_ROOM: (orderId: string, type?: 'offer') =>
    `/p2p/trading-room/${orderId}${type === 'offer' ? '?type=offer' : ''}`,
  SWAP: '/swap',
  TRANSACTION: (hash: string, queryParams?: string) => `/transactions/${hash}${queryParams ? `?${queryParams}` : ''}`,
  TRANSACTIONS: '/transactions',
  TRANSFER: '/transfer',
  WALLET: (address: string, queryParams?: string) => `/wallets/${address}${queryParams ? `?${queryParams}` : ''}`,
  WALLETS: '/wallets',
  EXPORT_CSV: '/export-transactions-csv',

  CREATE_DONATION_UPDATE: (slug: string) => `/donation-campaign/${slug}/create-update`,
  EDIT_DONATION_UPDATE: (slug: string, tx_hash: string) => `/donation-campaign/${slug}/edit-update/${tx_hash}`,
} as const;
