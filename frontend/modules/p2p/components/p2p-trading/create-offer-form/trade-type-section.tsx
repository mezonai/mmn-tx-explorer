'use client';

import { Control, Controller, useWatch, useFormState, UseFormTrigger } from 'react-hook-form';
import { TradeTypes } from '@/modules/p2p/types';
import { CreateOfferFormValues } from './validation-schema';
import { APP_CONFIG } from '@/configs/app.config';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/modules/p2p/util';
import { Input } from '@/components/ui/input';

interface TradeTypeSectionProps {
  control: Control<CreateOfferFormValues>;
  trigger: UseFormTrigger<CreateOfferFormValues>;
}

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};
const LIMIT_MAX_AMOUNT = 1000000000000;
export const TradeTypeSection = ({ control, trigger }: TradeTypeSectionProps) => {
  const { errors } = useFormState({ control });

  const tradeType = useWatch({ control, name: 'side' });
  const exchangeRate = useWatch({ control, name: 'price_rate' });
  const amountMZD = useWatch({ control, name: 'amount' });
  const totalVND = (parseFloat(exchangeRate) || 0) > 0 ? (amountMZD || 0) * (parseFloat(exchangeRate) || 0) : 0;
  return (
    <div className="border-border space-y-4 border-b pb-4 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
      <div className="flex items-center gap-2">
        <span className="bg-card text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs">
          2
        </span>
        <h3 className="text-foreground text-sm font-semibold">Trade Limits & Total Amount</h3>
      </div>

      {/* Limits */}
      <div>
        <div className="grid grid-cols-1 gap-3">
          {/* Min Limit */}
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Minimum</label>
            <div className="relative">
              <Controller
                control={control}
                name="limit.min"
                render={({ field }) => (
                  <>
                    <Input
                      type="text"
                      placeholder="0"
                      value={formatCurrency(field.value)}
                      onChange={(e) => {
                        if (getRawValue(e.target.value) > LIMIT_MAX_AMOUNT) return;
                        field.onChange(getRawValue(e.target.value));
                        trigger(['amount', 'price_rate']);
                      }}
                      className={cn(
                        'bg-input/30 w-full rounded-md border px-3 py-2.5 text-lg font-bold transition-colors focus:outline-none',
                        errors.limit?.min
                          ? 'border-utility-error-600! !focus:border-utility-error-600 focus:ring-0 focus-visible:ring-0'
                          : 'border-border'
                      )}
                    />
                    <span className="absolute top-4.5 right-2 text-xs font-bold text-gray-500">
                      {APP_CONFIG.CHAIN_SYMBOL}
                    </span>
                    {errors.limit?.min && (
                      <p className="text-utility-error-600 mt-1 text-xs">{errors.limit.min.message}</p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          {/* Max Limit */}
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Maximum</label>
            <div className="relative">
              <Controller
                control={control}
                name="limit.max"
                render={({ field }) => (
                  <>
                    <div>
                      <Input
                        type="text"
                        placeholder="0"
                        value={formatCurrency(field.value)}
                        onChange={(e) => {
                          if (getRawValue(e.target.value) > LIMIT_MAX_AMOUNT) return;
                          field.onChange(getRawValue(e.target.value));
                          trigger(['amount']);
                        }}
                        className={cn(
                          'bg-input/30 w-full rounded-md border px-3 py-2.5 text-lg font-bold transition-colors focus:outline-none',
                          errors.limit?.max
                            ? 'border-utility-error-600! !focus:border-utility-error-600 focus:ring-0 focus-visible:ring-0'
                            : 'border-border'
                        )}
                      />
                      <span className="absolute top-4.5 right-2 text-xs font-bold text-gray-500">
                        {APP_CONFIG.CHAIN_SYMBOL}
                      </span>
                    </div>
                    {errors.limit?.max && (
                      <p className="text-utility-error-600 mt-1 text-xs">{errors.limit.max.message}</p>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="pt-2">
        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">
          {tradeType === TradeTypes.SELL ? 'Total Received (VND)' : 'Total Paid (VND)'}
        </label>
        <div className="border-border bg-card flex h-24 flex-col items-center justify-center rounded-lg border px-4 py-4">
          <span className="text-utility-success-600 text-xl font-bold">{formatCurrency(totalVND)}</span>
          <span className="text-muted-foreground mt-1 text-xs font-bold">VND</span>
        </div>
      </div>
    </div>
  );
};
