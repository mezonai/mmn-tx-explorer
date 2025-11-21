import { useConnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

export const useWalletConnect = (isDesktop: boolean) => {
  const { connect } = useConnect();

  const connectMetaMask = async () => {
    try {
      connect({
        connector: metaMask({
          dappMetadata: {
            name: 'Mezon Dong',
          },
          preferDesktop: isDesktop,
        }),
      });
      return true;
    } catch (error) {
      console.error('Failed to connect:', error);
      return false;
    }
  };

  return { connectMetaMask };
};
