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

const parseRawValue = (val: string): string => {
  return val.replace(/,/g, '');
};

export const CurrencyInput = ({ value, onChange, error }: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const parsedDisplay = parseFloat(parseRawValue(displayValue));
    if (value !== parsedDisplay) {
      if (value === 0 && displayValue === '') return;
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;

    if (!/^[0-9,]*$/.test(rawInput)) return;

    setDisplayValue(rawInput);

    const numericString = parseRawValue(rawInput);
    const numericValue = parseFloat(numericString);

    if (numericValue > MAX_AMOUNT) return;

    if (isNaN(numericValue)) {
      onChange(0);
    } else {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    const numericValue = parseFloat(parseRawValue(displayValue));
    if (!isNaN(numericValue)) {
      setDisplayValue(formatCurrency(numericValue));
    } else {
      setDisplayValue('');
    }
  };

  return (
    <>
      <Input
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        type="text"
        placeholder="Ex: 5,000,000"
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
