import { useEffect, useState } from 'react';
import { formatCurrency } from '../../util';
import { Input } from '@/components/ui/input';
import { APP_CONFIG } from '@/configs/app.config';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  error?: string;
}
const MAX_AMOUNT = 1000000000000;

export const CurrencyInput = ({ value, onChange, error }: CurrencyInputProps) => {
  const formatValue = (val: number) => {
    if (val === 0) return '0';
    return formatCurrency(val);
  };

  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const currentNumericValue = parseFloat(displayValue.replace(/,/g, '') || '0');

    if (value !== currentNumericValue) {
      setDisplayValue(formatValue(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const numericString = rawInput.replace(/[^0-9]/g, '');

    if (numericString === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numericValue = parseFloat(numericString);

    if (numericValue > MAX_AMOUNT) return;

    setDisplayValue(formatValue(numericValue));
    onChange(numericValue);
  };

  return (
    <>
      <Input
        value={displayValue}
        onChange={handleChange}
        type="text"
        placeholder="0"
        className={cn(
          'bg-input/30 w-full rounded-md border px-3 py-2.5 text-lg font-bold transition-colors focus:outline-none',
          error
            ? 'border-utility-error-600! !focus:border-utility-error-600 focus:ring-0 focus-visible:ring-0'
            : 'border-border'
        )}
      />
      <span className="absolute top-4.5 right-2 text-xs font-bold text-gray-500">{APP_CONFIG.CHAIN_SYMBOL}</span>
      {error && <p className="text-utility-error-600 mt-1 text-xs">{error}</p>}
    </>
  );
};
