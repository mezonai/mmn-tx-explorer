export const BLOCK_ENDPOINTS = {
  LIST: '/:chainId/blocks',
  DETAILS: (blockNumber: string) => `/:chainId/blocks/${blockNumber}/detail`,
} as const;

export const DASHBOARD_BLOCKS_LIMIT = 3;
