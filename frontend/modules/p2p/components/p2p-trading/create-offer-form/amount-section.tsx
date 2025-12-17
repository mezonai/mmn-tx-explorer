'use client';

import { Control, Controller, UseFormTrigger, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { CreateOfferFormValues } from './validation-schema';
import { APP_CONFIG } from '@/configs/app.config';
import { cn } from '@/lib/utils';
interface AmountSectionProps {
  control: Control<CreateOfferFormValues>;
  trigger: UseFormTrigger<CreateOfferFormValues>;
  userBalance: string;
}

const formatCurrency = (num: number): string => {
  if (!num) return '';
  return new Intl.NumberFormat('en-US').format(num);
};

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/,/g, '')) || 0;
};
const MAX_AMOUNT = 1000000000000;
export const AmountSection = ({ control, trigger, userBalance }: AmountSectionProps) => {
  const amountMZD = useWatch({ control, name: 'amount' });
  const exchangeRate = useWatch({ control, name: 'price_rate' });
  const totalVND = parseFloat(exchangeRate) > 0 ? amountMZD * parseFloat(exchangeRate) : 0;

  return (
    <div className="border-border space-y-5 border-b pb-4 lg:border-r lg:border-b-0 lg:pr-8 lg:pb-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="bg-card text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs">
          2
        </span>
        <span className="text-foreground">Trading Volume</span>
      </h3>

      <div>
        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">
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
                    console.log(val);
                    if (val > MAX_AMOUNT) return;
                    field.onChange(val);
                    trigger(['limit.min', 'limit.max']);
                  }}
                  type="text"
                  placeholder="Ex: 5,000,000"
                  className={cn(
                    'bg-input/30 w-full rounded-md border px-3 py-2.5 text-lg font-bold transition-colors focus:outline-none',
                    error
                      ? 'border-utility-error-600! !focus:border-utility-error-600 focus:ring-0 focus-visible:ring-0'
                      : 'border-border'
                  )}
                />
                <span className="absolute top-4.5 right-2 text-xs font-bold text-gray-500">
                  {APP_CONFIG.CHAIN_SYMBOL}
                </span>
                {error && <p className="text-utility-error-600 mt-1 text-xs">{error.message}</p>}
              </>
            )}
          />
        </div>

        <div className="text-brand-primary mt-2 flex justify-end text-sm">
          <span>
            Balance: {userBalance ? userBalance : '-'} {APP_CONFIG.CHAIN_SYMBOL}
          </span>
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
                  className="border-border bg-card text-primary hover:border-brand-primary rounded border py-1.5 text-sm font-medium transition"
                >
                  {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
                </button>
              )}
            />
          ))}
        </div>
      </div>

      <div className="pt-2">
        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Total Received (VND)</label>
        <div className="border-border bg-card flex h-24 flex-col items-center justify-center rounded-lg border px-4 py-4">
          <span className="text-utility-success-600 text-xl font-bold">{formatCurrency(totalVND)}</span>
          <span className="text-muted-foreground mt-1 text-xs font-bold">VND</span>
        </div>
      </div>
    </div>
  );
};
