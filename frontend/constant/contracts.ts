// WMEZON Token Contract Address on BSC
export const WMEZON_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WMEZON_CONTRACT_ADDRESS || '0x2656eAF95dd8e0c31dAC3fd83A6663c1C6acB4eE';

// Hot Wallet Address (receives tokens from users)
export const HOT_WALLET_ADDRESS = process.env.NEXT_PUBLIC_HOT_WALLET_ADDRESS || '0x60ddf9a2c0c234a34dd3a53991e8db293ab15e83';

// WMEZON Contract ABI - only the functions we need
export const WMEZON_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'memo',
        type: 'bytes',
      },
    ],
    name: 'transferWithMemo',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
