'use client';

import { Control, Controller, UseFormSetValue, useFormState, useWatch } from 'react-hook-form';
import { CreateOfferFormValues } from './validation-schema';
import { TradeTypes } from '@/modules/p2p/types';
import { APP_CONFIG } from '@/configs/app.config';
import { CurrencyInput } from '../../shared/currency-input';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react';

interface AmountSectionProps {
  control: Control<CreateOfferFormValues>;
  setValue: UseFormSetValue<CreateOfferFormValues>;
  userBalance: string;
}

const MAX_AMOUNT = 1000000;

export const AmountSection = ({ control, setValue, userBalance }: AmountSectionProps) => {
  const exchangeRate = useWatch({ control, name: 'price_rate' });
  const currentAmount = useWatch({ control, name: 'amount' });
  const tradeType = useWatch({ control, name: 'side' });
  const { errors } = useFormState({ control });
  const maxBalance = useMemo(() => {
    if (!userBalance) return 0;
    const cleanBalance = userBalance.toString().replace(/,/g, '');
    return parseFloat(cleanBalance) || 0;
  }, [userBalance]);

  // Calculate Slider Position (0-100)
  const sliderValue = useMemo(() => {
    if (!currentAmount || !maxBalance) return 0;
    const val = (Number(currentAmount) / maxBalance) * 100;
    return Math.min(val, 100);
  }, [currentAmount, maxBalance]);

  // Handle Drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);

    if (percent === 0) {
      setValue('amount', 0, { shouldValidate: true, shouldDirty: true });
      return;
    }

    if (percent === 100) {
      setValue('amount', maxBalance, { shouldValidate: true, shouldDirty: true });
      return;
    }

    const rawAmount = (maxBalance * percent) / 100;

    let step = 1;
    if (rawAmount >= 1000) {
      step = 1000;
    } else if (rawAmount >= 100) {
      step = 100;
    }

    const cleanAmount = Math.floor(rawAmount / step) * step;

    setValue('amount', cleanAmount, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="border-border space-y-5 border-b pb-4 lg:border-r lg:border-b-0 lg:pr-8 lg:pb-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="bg-card text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs">
          1
        </span>
        <span className="text-foreground">Price & Amount</span>
      </h3>

      <div>
        <label className="text-muted-foreground mb-2 block text-xs font-medium">
          Amount to {tradeType === TradeTypes.SELL ? 'Sell' : 'Buy'} ({APP_CONFIG.CHAIN_SYMBOL})
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
                }}
                error={error?.message}
              />
            )}
          />
        </div>

        <div className="text-brand-primary mt-2 flex justify-between text-sm">
          <span>
            Balance: {userBalance ? userBalance : '-'} {APP_CONFIG.CHAIN_SYMBOL}
          </span>
        </div>

        {/* Range Slider */}
        <div className="mt-4 px-1">
          <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={!maxBalance}
            className="bg-input/50 accent-brand-primary focus:ring-brand-primary/50 h-2 w-full cursor-pointer appearance-none rounded-lg focus:ring-2 focus:outline-none"
            style={{
              backgroundImage: `linear-gradient(to right, var(--brand-primary), var(--brand-primary))`,
              backgroundSize: `${sliderValue}% 100%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>
      </div>

      <div className="border-brand-primary bg-card rounded-lg border p-3">
        <label className="text-brand-primary mb-2 block text-xs font-medium">
          {tradeType === TradeTypes.SELL ? 'Sell Rate' : 'Buy Rate'} (VND/{APP_CONFIG.CHAIN_SYMBOL})
        </label>
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="price_rate"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <div className="flex-1">
                <Input
                  {...fieldProps}
                  type="text"
                  value={value}
                  placeholder="0.8"
                  autoComplete="off"
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!/^\d*\.?\d*$/.test(val)) return;
                    if (val.startsWith('.')) val = '0' + val;
                    const cleanVal = val.replace(/^0+(?=\d)/, '');
                    if (cleanVal !== '' && parseFloat(cleanVal) >= MAX_AMOUNT) return;
                    if (cleanVal.includes('.')) {
                      const decimalPart = cleanVal.split('.')[1];
                      if (decimalPart && decimalPart.length > 3) return;
                    }
                    onChange(cleanVal);
                  }}
                  className={cn(
                    'bg-input/30 text-foreground focus:ring-brand-primary w-full rounded border px-3 py-1.5 text-sm focus:outline-none',
                    errors.price_rate ? 'border-utility-error-600 focus:ring-0' : 'border-border'
                  )}
                />
              </div>
            )}
          />
          <span className="text-muted-foreground text-xs whitespace-nowrap">VND/{APP_CONFIG.CHAIN_SYMBOL}</span>
        </div>

        {errors.price_rate && <p className="text-utility-error-600 mt-1 text-xs">{errors.price_rate.message}</p>}

        {parseFloat(exchangeRate) > 0 && (
          <div className="border-border mt-2 border-t pt-2">
            <div className="text-center">
              <p className="text-brand-primary mb-0.5 text-xs">Exchange rate</p>
              <p className="text-foreground text-lg font-bold">
                1 {APP_CONFIG.CHAIN_SYMBOL} = {parseFloat(exchangeRate).toLocaleString('en-US')} VND
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
