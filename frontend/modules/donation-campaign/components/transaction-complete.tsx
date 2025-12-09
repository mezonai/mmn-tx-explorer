export interface TransactionCompleteProps {
  amount: number | string;
  symbol?: string;
  txHash?: string;
  type?: TransactionType;
  onClose?: () => void;
}

export enum TransactionType {
  Donation = 'donation',
  Withdraw = 'withdraw',
}

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { APP_CONFIG } from '@/configs/app.config';

export const TransactionComplete = (props: TransactionCompleteProps) => {
  const { amount, symbol, txHash, type, onClose } = props;
  const finalSymbol = symbol || APP_CONFIG.CHAIN_SYMBOL;
  const finalType = type || TransactionType.Donation;
  const title = finalType === TransactionType.Withdraw ? 'Withdrawal Complete!' : 'Donation confirmed!';
  const description =
    finalType === TransactionType.Withdraw
      ? 'Your donation withdrawal was successful.'
      : "You're part of something bigger now.";
  return (
    <div className="relative flex flex-col items-center space-y-5 text-center">
      <div className="flex flex-col items-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-600">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <div className="bg-brand-primary/10 border-brand-primary/40 borde mt-1 w-full rounded-xl p-5 focus:ring-0 focus:outline-none">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <p className="text-xs uppercase">
              Amount {finalType === TransactionType.Withdraw ? 'Withdrawn' : 'Donated'}
            </p>
            <p className="text-brand-primary text-3xl font-bold">
              {amount}
              <span className="ml-1.5 text-xl font-medium">{finalSymbol}</span>
            </p>
          </div>

          {finalType === TransactionType.Donation && <div className="w-full border-t"></div>}

          {txHash && (
            <div className="w-full space-y-2 text-left">
              <p className="text-center text-xs uppercase">Transaction Hash</p>
              <div className="flex items-center gap-2">
                <p className="text-card-foreground flex-1 truncate font-mono text-sm">{txHash}</p>
                <CopyButton textToCopy={txHash} />
              </div>
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <Button
          onClick={onClose}
          className="bg-brand-primary hover:bg-brand-primary/85 group flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
        >
          Close
        </Button>
      )}
    </div>
  );
};
