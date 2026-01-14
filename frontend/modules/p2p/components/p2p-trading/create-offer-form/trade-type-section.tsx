'use client';

import { Control, Controller, useWatch, useFormState, UseFormTrigger } from 'react-hook-form';
import { TradeTypes } from '@/modules/p2p/types';
import { CreateOfferFormValues } from './validation-schema';
import { APP_CONFIG } from '@/configs/app.config';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/modules/p2p/util';

interface TradeTypeSectionProps {
  control: Control<CreateOfferFormValues>;
  trigger: UseFormTrigger<CreateOfferFormValues>;
}

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};
const MAX_AMOUNT = 1000000;
const LIMIT_MAX_AMOUNT = 1000000000000;
export const TradeTypeSection = ({ control, trigger }: TradeTypeSectionProps) => {
  const { errors } = useFormState({ control });

  const tradeType = useWatch({ control, name: 'side' });
  const exchangeRate = useWatch({ control, name: 'price_rate' });
  const amountMZD = useWatch({ control, name: 'amount' });

  return (
    <div className="border-border space-y-4 border-b pb-4 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
      <div className="flex items-center gap-2">
        <span className="bg-card text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs">
          1
        </span>
        <h3 className="text-foreground text-sm font-semibold">Order Type & Asset</h3>
      </div>

      {/* Trade Type & Asset - Grid Layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Trade Type */}
        {/* <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Hành động</label>
          <div className="bg-input/30 dark:bg-input/30 flex rounded border border-gray-700 p-0.5">
            <button
              onClick={() => onTradeTypeChange('BUY')}
              className={`flex-1 rounded py-1.5 text-xs font-bold transition ${
                tradeType === 'BUY' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              MUA
            </button>
            <button
              onClick={() => onTradeTypeChange('SELL')}
              className={`flex-1 rounded py-1.5 text-xs font-bold transition ${
                tradeType === 'SELL' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              BÁN
            </button>
          </div>
        </div> */}

        {/* Asset */}
        {/* <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Tài sản</label>
          <div className="bg-input/30 dark:bg-input/30 flex h-[34px] items-center justify-between rounded border border-gray-700 px-3 py-1.5">
            <span className="text-sm font-semibold text-white">MZD</span>
            <Lock className="h-3 w-3 text-gray-600" />
          </div>
        </div> */}
      </div>

      {tradeType === TradeTypes.SELL && (
        <>
          {/* Exchange Rate */}
          <div className="border-brand-primary bg-card rounded-lg border p-3">
            <label className="text-brand-primary mb-2 block text-xs font-medium">
              Sell Rate (VND/{APP_CONFIG.CHAIN_SYMBOL})
            </label>
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="price_rate"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <div className="flex-1">
                    <input
                      {...fieldProps}
                      type="text"
                      value={value}
                      placeholder="0.8"
                      autoComplete="off"
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!/^\d*\.?\d*$/.test(val)) {
                          return;
                        }
                        if (val.startsWith('.')) {
                          val = '0' + val;
                        }
                        const cleanVal = val.replace(/^0+(?=\d)/, '');
                        if (cleanVal !== '' && parseFloat(cleanVal) >= MAX_AMOUNT) {
                          return;
                        }
                        if (cleanVal.includes('.')) {
                          const decimalPart = cleanVal.split('.')[1];
                          if (decimalPart && decimalPart.length > 3) {
                            return;
                          }
                        }
                        onChange(cleanVal);
                      }}
                      className={cn(
                        'bg-input/30 text-foreground w-full rounded border px-3 py-1.5 text-sm focus:outline-none',
                        errors.price_rate ? 'border-utility-error-600' : 'border-border'
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

          {/* Limits */}
          <div>
            <label className="text-muted-foreground mb-2 block text-xs font-medium">
              Transaction Limits ({APP_CONFIG.CHAIN_SYMBOL})
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Min Limit */}
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">Minimum</label>
                <div className="relative">
                  <Controller
                    control={control}
                    name="limit.min"
                    render={({ field }) => (
                      <>
                        <input
                          type="text"
                          placeholder="100"
                          value={formatCurrency(field.value)}
                          onChange={(e) => {
                            if (getRawValue(e.target.value) > LIMIT_MAX_AMOUNT) return;
                            field.onChange(getRawValue(e.target.value));
                            trigger(['limit.max']);
                          }}
                          className={cn(
                            'bg-input/30 text-foreground w-full rounded border px-3 py-1.5 pr-12 text-sm focus:outline-none',
                            errors.limit?.min ? 'border-utility-error-600' : 'border-border'
                          )}
                        />
                        <span className="absolute top-2 right-1.5 text-xs text-gray-500">
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
                          <input
                            type="text"
                            placeholder={amountMZD > 0 ? formatCurrency(amountMZD) : '5,000'}
                            value={formatCurrency(field.value)}
                            onChange={(e) => {
                              if (getRawValue(e.target.value) > LIMIT_MAX_AMOUNT) return;
                              field.onChange(getRawValue(e.target.value));
                              trigger(['limit.min']);
                            }}
                            className={cn(
                              'bg-input/30 text-foreground w-full rounded border px-3 py-1.5 pr-12 text-sm focus:outline-none',
                              errors.limit?.max ? 'border-utility-error-600' : 'border-border'
                            )}
                          />
                          <span className="absolute top-2 right-1.5 text-xs text-gray-500">
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
            {amountMZD > 0 && (
              <p className="text-muted-foreground mt-2 text-xs">
                Max limit:{' '}
                <span className="text-utility-success-600 font-medium">
                  {formatCurrency(amountMZD)} {APP_CONFIG.CHAIN_SYMBOL}
                </span>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
