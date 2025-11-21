import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { bsc, bscTestnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Mezon Dong',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [bsc, bscTestnet],
  ssr: true,
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
});
