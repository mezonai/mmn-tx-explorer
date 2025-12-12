'use client';

import { Control, Controller, UseFormTrigger, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { CreateOfferFormValues } from './validation-schema';
import { APP_CONFIG } from '@/configs/app.config';

interface AmountSectionProps {
  control: Control<CreateOfferFormValues>;
  trigger: UseFormTrigger<CreateOfferFormValues>;
}

const formatCurrency = (num: number): string => {
  if (!num) return '';
  return new Intl.NumberFormat('en-US').format(num);
};

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/,/g, '')) || 0;
};
const MAX_AMOUNT = 1000000000000;
export const AmountSection = ({ control, trigger }: AmountSectionProps) => {
  const amountMZD = useWatch({ control, name: 'amount' });
  const exchangeRate = useWatch({ control, name: 'price_rate' });
  const totalVND = exchangeRate > 0 ? amountMZD * exchangeRate : 0;

  return (
    <div className="space-y-5 border-b border-gray-800 pb-4 lg:border-r lg:border-b-0 lg:pr-8 lg:pb-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400">
          2
        </span>
        Trading Volume
      </h3>

      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">
          Amount to Sell ({APP_CONFIG.CHAIN_SYMBOL})
        </label>
        <div className="group relative">
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState: { error } }) => (
              <>
                <Input
                  {...field}
                  value={formatCurrency(field.value)}
                  onChange={(e) => {
                    const val = getRawValue(e.target.value);
                    if (val > MAX_AMOUNT) return;
                    field.onChange(val);
                    trigger(['limit.min', 'limit.max']);
                  }}
                  type="text"
                  placeholder="Ex: 5,000,000"
                  className={`bg-input/30 dark:bg-input/30 focus:border-brand-primary w-full rounded-md border-gray-700 px-3 py-2.5 text-lg font-bold text-white placeholder-gray-600 transition-colors group-hover:border-gray-600 focus:outline-none ${
                    error ? 'border-red-500' : ''
                  }`}
                />
                <span className="absolute top-3.5 right-3 text-xs font-bold text-gray-500">
                  {APP_CONFIG.CHAIN_SYMBOL}
                </span>
                {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
              </>
            )}
          />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {[100000, 500000, 1000000, 5000000].map((val) => (
            <Controller
              key={val}
              control={control}
              name="amount"
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => {
                    field.onChange(val);
                    trigger(['limit.min', 'limit.max']);
                  }}
                  className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700 hover:text-white"
                >
                  {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
                </button>
              )}
            />
          ))}
        </div>
      </div>

      <div className="pt-2">
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Total Received (VND)</label>
        <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-4">
          <span className="text-xl font-bold text-green-400">{formatCurrency(totalVND)}</span>
          <span className="mt-1 text-xs font-bold text-gray-500">VND</span>
        </div>
      </div>
    </div>
  );
};
