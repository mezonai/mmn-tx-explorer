'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SwapAmountInputProps {
  amount: string;
  balance: string;
  tokenSymbol?: string;
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
  tokenSymbol = 'WMezon',
  onAmountChange,
  onMaxClick,
  disabled = false,
}: SwapAmountInputProps) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm md:text-base font-medium text-foreground">Amount</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMaxClick}
            disabled={disabled}
            className="h-auto px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-brand-primary hover:text-white hover:bg-brand-primary/90"
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
          className="text-base md:text-lg h-14 md:h-16"
        />
      </div>

      <div className="flex items-center text-xs md:text-sm text-muted-foreground">
        <span>
          Available: {formatNumberWithCommas(balance)} {tokenSymbol}
        </span>
      </div>
    </div>
  );
};
