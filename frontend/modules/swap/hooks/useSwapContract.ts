import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, encodePacked, keccak256, toHex } from 'viem';
import { WMEZON_CONTRACT_ADDRESS, HOT_WALLET_ADDRESS, WMEZON_ABI } from '@/constant/contracts';

interface SwapMemoData {
  from_address: string;
  type: string;
}

/**
 * Parse error message to user-friendly format
 */
function parseErrorMessage(error: Error | null): string | null {
  if (!error) return null;

  const errorMessage = error.message.toLowerCase();

  // User rejected transaction
  if (errorMessage.includes('user rejected') || 
      errorMessage.includes('user denied') ||
      errorMessage.includes('user cancelled')) {
    return 'Transaction cancelled by user';
  }

  // Insufficient balance
  if (errorMessage.includes('insufficient funds') ||
      errorMessage.includes('insufficient balance')) {
    return 'Insufficient balance to complete transaction';
  }

  // Gas estimation failed
  if (errorMessage.includes('gas') && errorMessage.includes('estimate')) {
    return 'Unable to estimate gas. Please check your balance and try again';
  }

  // Network error
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network connection error. Please check your internet and try again';
  }

  // Generic contract error
  if (errorMessage.includes('execution reverted')) {
    return 'Transaction failed. Please check your balance and allowance';
  }

  // Default: return first 100 characters
  return error.message.length > 100 
    ? error.message.substring(0, 100) + '...' 
    : error.message;
}

/**
 * Generate hex-encoded memo for swap transaction
 */
function generateSwapMemo(fromAddress: string): `0x${string}` {
  const memoData: SwapMemoData = {
    from_address: fromAddress,
    type: 'swap-token',
  };

  const jsonString = JSON.stringify(memoData);
  const hexString = Buffer.from(jsonString, 'utf-8').toString('hex');
  return `0x${hexString}`;
}

export function useSwapContract() {
  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Execute swap: Transfer WMEZON tokens to hot wallet with memo
   * @param amount - Amount in tokens (e.g., "100" for 100 WMEZON)
   * @param userAddress - User's wallet address (for memo)
   */
  const executeSwap = (amount: string, userAddress: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount');
    }

    try {
      // Convert amount to Wei (18 decimals)
      const amountInWei = parseUnits(amount, 18);

      // Generate memo with user address
      const memo = generateSwapMemo(userAddress);

      console.log('Executing swap:', {
        to: HOT_WALLET_ADDRESS,
        amount: amountInWei.toString(),
        memo,
      });

      // Call transferWithMemo function
      writeContract({
        address: WMEZON_CONTRACT_ADDRESS as `0x${string}`,
        abi: WMEZON_ABI,
        functionName: 'transferWithMemo',
        args: [HOT_WALLET_ADDRESS as `0x${string}`, amountInWei, memo],
      });
    } catch (err) {
      console.error('Error executing swap:', err);
      throw err;
    }
  };

  return {
    executeSwap,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: writeError,
    errorMessage: parseErrorMessage(writeError),
  };
}

/**
 * Hook to read user's WMEZON token balance
 */
export function useWMEZONBalance(address?: string) {
  const { data: balance, isLoading } = useReadContract({
    address: WMEZON_CONTRACT_ADDRESS as `0x${string}`,
    abi: WMEZON_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
  });

  return {
    balance: balance ? balance.toString() : '0',
    isLoading,
  };
}
