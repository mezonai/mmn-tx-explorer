import { APP_CONFIG } from '@/configs/app.config';

export const buildPathWithChain = (path: string) => {
  return path.replace(':chainId', APP_CONFIG.CHAIN_ID);
};
