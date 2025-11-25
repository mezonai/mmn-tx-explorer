import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { bsc, bscTestnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Mezon Đồng',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '44cafafcb2a1f11b8c9b1c360fcd3223',
  chains: [bsc, bscTestnet], // Add other chains if needed(delete bscTestnet for production)
  ssr: true,
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
});
