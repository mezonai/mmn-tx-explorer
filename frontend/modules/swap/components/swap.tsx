'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectWalletButton } from './ConnectWalletButton';
import { WalletModal } from './WalletModal';
import { SwapDirectionTabs } from './SwapDirectionTabs';
import { SwapAmountInput } from './SwapAmountInput';
import { EstimatedOutput } from './EstimatedOutput';
import { BridgeStatus } from './BridgeStatus';
import { SwapHistory } from './SwapHistory';
import { useDeviceDetect } from '../hooks/useDeviceDetect';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { useSwapContract, useWMEZONBalance } from '../hooks/useSwapContract';
import { useCreateSwapHistory } from '../hooks/useCreateSwapHistory';
import { TokenSymbol } from '@/constant/token.constant';
import { useAuth, useAuthActions } from '@/providers/AppProvider';
import { SWAP_TYPE } from '../constants';
import { HOT_WALLET_ADDRESS } from '@/constant/contracts';
import { AlertTriangle } from 'lucide-react';

export const Swap = () => {
  const { address, isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const { login } = useAuthActions();
  const [amount, setAmount] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [savedTxHashes, setSavedTxHashes] = useState<Set<string>>(new Set());
  const [swapDirection, setSwapDirection] = useState<'wmzd-to-mzd' | 'mzd-to-wmzd'>('wmzd-to-mzd');

  const { isDesktop } = useDeviceDetect();
  const { connectMetaMask } = useWalletConnect(isDesktop);

  const { executeSwap, hash, isPending, isConfirming, isConfirmed, errorMessage } = useSwapContract();
  const { balance } = useWMEZONBalance(address);

  const { mutate: createSwapHistory } = useCreateSwapHistory();

  const formattedBalance = balance ? formatUnits(BigInt(balance), 18) : '0';

  const handleSwap = () => {
    if (!address || !amount) return;
    executeSwap(amount, address, balance);
  };

  const handleMaxClick = () => {
    setAmount(formattedBalance);
  };

  useEffect(() => {
    if (isConfirmed && hash && address && amount && !savedTxHashes.has(hash)) {
      createSwapHistory({
        send_wallet_address: address,
        receive_wallet_address: HOT_WALLET_ADDRESS,
        tx_hash: hash,
        amount: parseFloat(amount),
        type: SWAP_TYPE.TRANSFER_BSC,
      });

      setSavedTxHashes((prev) => new Set(prev).add(hash));
    }
  }, [isConfirmed, hash, address, amount, savedTxHashes, createSwapHistory]);

  const handleConnectMetaMask = async () => {
    const success = await connectMetaMask();
    if (success) {
      setShowWalletModal(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 md:py-8 lg:px-8">
      <Card className="border-border bg-card">
        <CardHeader className="px-4 py-4 md:px-6 md:py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <CardTitle className="text-xl md:text-2xl">Swap</CardTitle>
            {isAuthenticated && <ConnectWalletButton onConnectClick={() => setShowWalletModal(true)} />}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-6 md:px-6">
          {!isAuthenticated ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-6">Please login to access the swap feature</p>
              </div>
              <Button onClick={login} size="lg" className="bg-brand-primary hover:bg-brand-primary/90 px-8 text-white">
                Login with Mezon
              </Button>
            </div>
          ) : !isConnected ? (
            <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Please connect your wallet to start swapping
              </p>
            </div>
          ) : (
            <>
              <SwapDirectionTabs direction={swapDirection} onDirectionChange={setSwapDirection} />

              <SwapAmountInput
                amount={amount}
                balance={formattedBalance}
                tokenSymbol={TokenSymbol.WMezon}
                onAmountChange={setAmount}
                onMaxClick={handleMaxClick}
                disabled={isPending || isConfirming}
              />

              <EstimatedOutput amount={amount} tokenSymbol={TokenSymbol.WMezon} />

              {errorMessage && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              <Button
                onClick={handleSwap}
                disabled={!amount || isPending || isConfirming}
                className="bg-brand-primary hover:bg-brand-primary/90 h-14 w-full text-base font-semibold text-white md:h-16 md:text-lg"
                size="lg"
              >
                {isPending ? 'Waiting for approval...' : isConfirming ? 'Confirming...' : 'Swap Now'}
              </Button>

              <BridgeStatus
                show={isPending || isConfirming || !!hash}
                txHash={hash}
                isPending={isPending}
                isConfirming={isConfirming}
                isConfirmed={isConfirmed}
              />

              <SwapHistory />
            </>
          )}
        </CardContent>
      </Card>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleConnectMetaMask}
      />
    </div>
  );
};
