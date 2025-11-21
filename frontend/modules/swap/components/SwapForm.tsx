'use client';

import { formatUnits } from 'viem';

interface SwapFormProps {
  amount: string;
  address?: string;
  balance: string;
  isPending: boolean;
  isConfirming: boolean;
  onAmountChange: (value: string) => void;
  onSwap: () => void;
  error?: string;
}

export const SwapForm = ({
  amount,
  address,
  balance,
  isPending,
  isConfirming,
  onAmountChange,
  onSwap,
  error,
}: SwapFormProps) => {
  const formattedBalance = balance ? formatUnits(BigInt(balance), 18) : '0';
  const hasEnoughBalance = balance && amount ? BigInt(balance) >= BigInt(parseFloat(amount) * 1e18) : true;

  return (
    <div className="space-y-4">
      {/* Balance Display */}
      <div className="rounded-md bg-muted p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Your WMEZON Balance:</p>
          <p className="font-mono text-sm font-medium">{parseFloat(formattedBalance).toFixed(4)} WMEZON</p>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="amount" className="block text-sm font-medium">
            Amount (WMEZON)
          </label>
          <button
            type="button"
            onClick={() => onAmountChange(formattedBalance)}
            className="text-xs text-primary hover:underline"
          >
            Max
          </button>
        </div>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.0"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {!hasEnoughBalance && amount && (
          <p className="mt-1 text-xs text-red-500">Insufficient balance</p>
        )}
      </div>

      {/* Connected Address */}
      <div className="rounded-md bg-muted p-3">
        <p className="text-sm text-muted-foreground">Connected Wallet:</p>
        <p className="font-mono text-sm">{address}</p>
      </div>

      {/* Info Box */}
      <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
        <p className="text-xs text-blue-600 dark:text-blue-400">
          💡 You will transfer WMEZON tokens to the hot wallet. The transaction will be recorded with your wallet address.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <div className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400">⚠️</span>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={onSwap}
        disabled={!amount || !hasEnoughBalance || isPending || isConfirming}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Waiting for approval...' : isConfirming ? 'Confirming...' : 'Swap'}
      </button>
    </div>
  );
};
