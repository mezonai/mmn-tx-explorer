export const buildPathWithChain = (path: string, chainId: string | number) => {
  return path.replace(':chainId', String(chainId));
};
