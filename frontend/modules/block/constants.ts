export const BLOCK_ENDPOINTS = {
  LIST: '/:chainId/blocks',
  DETAILS: (blockNumber: number) => `/:chainId/blocks/${blockNumber}/detail`,
} as const;

export const DASHBOARD_BLOCKS_LIMIT = 5;
export const BLOCKS_QUERY_KEY = 'blocks';
