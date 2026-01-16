const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'mezon_language',
  SEARCH_HISTORY: 'mezon_search_history',
  AUTH_TOKEN: 'auth_token',
  TOKEN: 'token',
  USER_INFO: 'user_info',
  KEY_PAIR: 'key_pair',
  ZK_PROOF: 'zkProof',
  SHOW_MINE_CAMPAIGNS: 'show_mine_campaigns',
  LIGHT_CLIENT: 'light_client',
  P2P_PENDING_GREETING: (orderId: string) => `p2p_pending_greeting_${orderId}`,
} as const;

export { STORAGE_KEYS };
