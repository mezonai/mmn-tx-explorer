'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TokenSymbol } from '@/constant/token.constant';

interface SwapAmountInputProps {
  amount: string;
  balance: string;
  tokenSymbol?: TokenSymbol;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  disabled?: boolean;
}

const formatNumberWithCommas = (value: string | number): string => {
  const str = typeof value === 'number' ? value.toString() : value;
  if (!str || str === '.') return str;
  const [integer, decimal] = str.split('.');
  if (integer === '' && decimal === undefined) return str;
  const formattedInteger = integer ? parseInt(integer).toLocaleString('en-US') : '0';
  if (decimal !== undefined) {
    return `${formattedInteger}.${decimal}`;
  }
  return formattedInteger;
};

export const SwapAmountInput = ({
  amount,
  balance,
  tokenSymbol = TokenSymbol.WMezon,
  onAmountChange,
  onMaxClick,
  disabled = false,
}: SwapAmountInputProps) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-foreground text-sm font-medium md:text-base">Amount</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMaxClick}
            disabled={disabled}
            className="text-brand-primary hover:bg-brand-primary/90 h-auto px-3 py-1.5 text-xs font-medium hover:text-white md:px-4 md:py-2 md:text-sm"
          >
            Max
          </Button>
        </div>
        <Input
          type="text"
          placeholder="0.0"
          value={amount ? formatNumberWithCommas(amount) : ''}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, '');
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              onAmountChange(value);
            }
          }}
          disabled={disabled}
          className="h-14 text-base md:h-16 md:text-lg"
        />
      </div>

      <div className="text-muted-foreground flex items-center text-xs md:text-sm">
        <span>
          Available: {formatNumberWithCommas(balance)} {tokenSymbol}
        </span>
      </div>
    </div>
  );
};
