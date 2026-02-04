import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, stringToHex } from 'viem';
import { WMEZON_CONTRACT_ADDRESS, HOT_WALLET_ADDRESS, WMEZON_ABI } from '@/constant/contracts';
import { useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { toast } from 'sonner';

function parseErrorMessage(error: Error | null): string | null {
  if (!error) return null;

  const errorMessage = error.message.toLowerCase();

  if (
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user denied') ||
    errorMessage.includes('user cancelled')
  ) {
    return 'Transaction cancelled by user';
  }

  if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
    return 'Insufficient balance to complete transaction';
  }

  if (errorMessage.includes('gas') && errorMessage.includes('estimate')) {
    return 'Unable to estimate gas. Please check your balance and try again';
  }

  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network connection error. Please check your internet and try again';
  }

  if (errorMessage.includes('execution reverted')) {
    return 'Transaction failed. Please check your balance and allowance';
  }

  return error.message.length > 100 ? error.message.substring(0, 100) + '...' : error.message;
}

function generateSwapMemo(fromAddress: string): `0x${string}` {
  const compactMemo = `{"a":"${fromAddress.toLowerCase()}"}`;
  return stringToHex(compactMemo);
}

export function useSwapContract() {
  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const publicClient = usePublicClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (hash && isConfirmed && publicClient) {
      const fetchTransactionData = async () => {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash });
          if (receipt.status === 'success') {
            toast.success('Swap transaction confirmed!');
          }
        } catch (error) {
          console.error('Error fetching transaction data:', error);
        }
      };

      fetchTransactionData();
    }
  }, [hash, isConfirmed, publicClient]);

  /**
   * Execute swap: Transfer WMEZON tokens to hot wallet with memo
   * @param amount - Amount in tokens (e.g., "100" for 100 WMEZON)
   * @param userAddress - User's wallet address (for memo)
   * @param userBalance - User's current token balance (optional, for validation)
   */
  const executeSwap = async (amount: string, userAddress: string, userBalance?: string) => {
    try {
      const intAmount = parseFloat(amount);
      const intUserBalance = userBalance ? parseFloat(formatUnits(BigInt(userBalance), 18)) : 0;

      if (!amount || intAmount <= 0) {
        throw new Error('Invalid amount');
      }

      if (userAddress === HOT_WALLET_ADDRESS) {
        throw new Error('Cannot swap to your own wallet. Please configure a different hot wallet address.');
      }

      if (userBalance && intAmount > intUserBalance) {
        throw new Error(
          `Insufficient balance. You have ${intUserBalance.toFixed(4)} WMEZON but trying to swap ${intAmount.toFixed(4)} WMEZON`
        );
      }

      const amountInWei = parseUnits(amount, 18);
      const memo = generateSwapMemo(userAddress);

      await writeContract({
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
