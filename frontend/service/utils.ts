export const buildPathWithChainId = (path: string): string => {
  const chainId = process.env.NEXT_PUBLIC_APP_CHAIN_ID;
  if (!chainId) {
    throw new Error(`Missing required env: NEXT_PUBLIC_APP_CHAIN_ID`);
  }
  return path.replace(':chainId', chainId);
};
