'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

import { ConnectWalletButton } from './ConnectWalletButton';
import { WalletModal } from './WalletModal';
import { SwapForm } from './SwapForm';
import { TransactionStatus } from './TransactionStatus';
import { useDeviceDetect } from '../hooks/useDeviceDetect';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { useSwapContract, useWMEZONBalance } from '../hooks/useSwapContract';
import { useCreateSwapHistory } from '../hooks/useCreateSwapHistory';
import { useAuth, useAuthActions } from '@/providers/AppProvider';
import { SWAP_TYPE } from '../constants';
import { HOT_WALLET_ADDRESS } from '@/constant/contracts';

export const Swap = () => {
  const { address, isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const { login } = useAuthActions();
  const [amount, setAmount] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [savedTxHashes, setSavedTxHashes] = useState<Set<string>>(new Set());

  const { isDesktop } = useDeviceDetect();
  const { connectMetaMask } = useWalletConnect(isDesktop);
  
  // Contract interaction hooks
  const { executeSwap, hash, isPending, isConfirming, isConfirmed, errorMessage } = useSwapContract();
  const { balance, isLoading: isLoadingBalance } = useWMEZONBalance(address);
  
  // API mutation hook
  const { mutate: createSwapHistory, isPending: isSavingHistory } = useCreateSwapHistory();

  const handleSwap = () => {
    if (!address || !amount) return;
    executeSwap(amount, address);
  };

  // Call API when transaction is confirmed (only once per transaction)
  useEffect(() => {
    if (isConfirmed && hash && address && amount && !savedTxHashes.has(hash)) {
      createSwapHistory({
        send_wallet_address: address,
        receive_wallet_address: HOT_WALLET_ADDRESS,
        tx_hash: hash,
        amount: parseFloat(amount),
        type: SWAP_TYPE.TRANSFER_BSC,
      });
      
      // Mark this transaction as saved
      setSavedTxHashes(prev => new Set(prev).add(hash));
    }
  }, [isConfirmed, hash, address, amount, savedTxHashes, createSwapHistory]);

  const handleConnectMetaMask = async () => {
    const success = await connectMetaMask();
    if (success) {
      setShowWalletModal(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border bg-card p-6 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold">Swap</h1>

        {!isAuthenticated ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <p className="mb-6 text-muted-foreground">
                Please login to access the swap feature
              </p>
            </div>
            <button
              onClick={login}
              className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Login with Mezon
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <ConnectWalletButton onConnectClick={() => setShowWalletModal(true)} />
            </div>

            {isConnected ? (
              <>
                <SwapForm
                  amount={amount}
                  address={address}
                  balance={balance}
                  isPending={isPending}
                  isConfirming={isConfirming}
                  onAmountChange={setAmount}
                  onSwap={handleSwap}
                  error={errorMessage || undefined}
                />
                <TransactionStatus hash={hash} isConfirmed={isConfirmed} />
              </>
            ) : (
              <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Please connect your wallet to start swapping
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleConnectMetaMask}
      />
    </div>
  );
};
