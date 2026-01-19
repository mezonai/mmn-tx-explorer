'use client';

import { Control, Controller, UseFormSetValue, UseFormTrigger, useWatch } from 'react-hook-form';
import { CreateOfferFormValues } from './validation-schema';
import { APP_CONFIG } from '@/configs/app.config';
import { CurrencyInput } from '../../shared/currency-input';
import { formatCurrency } from '@/modules/p2p/util';

interface AmountSectionProps {
  control: Control<CreateOfferFormValues>;
  trigger: UseFormTrigger<CreateOfferFormValues>;
  setValue: UseFormSetValue<CreateOfferFormValues>;
  userBalance: string;
}

export const AmountSection = ({ control, trigger, setValue, userBalance }: AmountSectionProps) => {
  const amountMZD = useWatch({ control, name: 'amount' });
  const exchangeRate = useWatch({ control, name: 'price_rate' });

  const totalVND = (parseFloat(exchangeRate) || 0) > 0 ? (amountMZD || 0) * (parseFloat(exchangeRate) || 0) : 0;

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
              <CurrencyInput
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  trigger(['limit.min', 'limit.max']);
                }}
                error={error?.message}
              />
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
            <button
              key={val}
              type="button"
              onClick={() => {
                setValue('amount', val, { shouldValidate: true, shouldDirty: true });
                trigger(['limit.min', 'limit.max']);
              }}
              className="border-border bg-card text-primary hover:border-brand-primary rounded border py-1.5 text-sm font-medium transition"
            >
              {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
            </button>
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
