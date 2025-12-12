'use client';

import { Control, Controller, useWatch, useFormState } from 'react-hook-form';
import { TradeTypes } from '@/modules/p2p/types';
import { CreateOfferFormValues } from './validation-schema';
import { APP_CONFIG } from '@/configs/app.config';

interface TradeTypeSectionProps {
  control: Control<CreateOfferFormValues>;
}

const formatCurrency = (num: number): string => {
  if (!num) return '';
  return new Intl.NumberFormat('en-US').format(num);
};

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};
const MAX_AMOUNT = 1000000;
const LIMIT_MAX_AMOUNT = 1000000000000;
export const TradeTypeSection = ({ control }: TradeTypeSectionProps) => {
  const { errors } = useFormState({ control });

  const tradeType = useWatch({ control, name: 'side' });
  const exchangeRate = useWatch({ control, name: 'price_rate' });
  const amountMZD = useWatch({ control, name: 'amount' });

  return (
    <div className="space-y-4 border-b border-gray-800 pb-4 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400">
          1
        </span>
        <h3 className="text-sm font-semibold text-white">Order Type & Asset</h3>
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
          <div className="rounded-lg border border-blue-600/20 bg-blue-600/10 p-3">
            <label className="mb-2 block text-xs font-medium text-blue-400">
              Sell Rate (VND/{APP_CONFIG.CHAIN_SYMBOL})
            </label>
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="price_rate"
                render={({ field }) => (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={field.value || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > MAX_AMOUNT) return;
                        if (!isNaN(val) || e.target.value === '') {
                          field.onChange(isNaN(val) ? 0 : val);
                        }
                      }}
                      placeholder="0.8"
                      className={`w-full rounded border bg-gray-900 px-3 py-1.5 text-sm text-white focus:outline-none ${
                        errors.price_rate ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
                      }`}
                    />
                  </div>
                )}
              />
              <span className="text-xs whitespace-nowrap text-gray-400">VND/{APP_CONFIG.CHAIN_SYMBOL}</span>
            </div>

            {errors.price_rate && <p className="mt-1 text-xs text-red-400">{errors.price_rate.message}</p>}

            {exchangeRate > 0 && (
              <div className="mt-2 border-t border-blue-800/20 pt-2">
                <div className="text-center">
                  <p className="mb-0.5 text-xs text-blue-400/80">Exchange rate</p>
                  <p className="text-lg font-bold text-white">
                    1 {APP_CONFIG.CHAIN_SYMBOL} = {exchangeRate.toLocaleString('en-US')} VND
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Limits */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-500">
              Transaction Limits ({APP_CONFIG.CHAIN_SYMBOL})
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Min Limit */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">Minimum</label>
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
                          }}
                          className={`w-full rounded border bg-gray-900 px-3 py-1.5 pr-12 text-sm text-white focus:ring-1 focus:outline-none ${
                            errors.limit?.min
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        />
                        <span className="absolute top-1.5 right-3 text-xs text-gray-500">
                          {APP_CONFIG.CHAIN_SYMBOL}
                        </span>
                        {errors.limit?.min && <p className="mt-1 text-xs text-red-400">{errors.limit.min.message}</p>}
                      </>
                    )}
                  />
                </div>
              </div>

              {/* Max Limit */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">Maximum</label>
                <div className="relative">
                  <Controller
                    control={control}
                    name="limit.max"
                    render={({ field }) => (
                      <>
                        <input
                          type="text"
                          placeholder={amountMZD > 0 ? formatCurrency(amountMZD) : '5,000'}
                          value={formatCurrency(field.value)}
                          onChange={(e) => {
                            if (getRawValue(e.target.value) > LIMIT_MAX_AMOUNT) return;
                            field.onChange(getRawValue(e.target.value));
                          }}
                          className={`w-full rounded border bg-gray-900 px-3 py-1.5 pr-12 text-sm text-white focus:ring-1 focus:outline-none ${
                            errors.limit?.max
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        />
                        <span className="absolute top-1.5 right-3 text-xs text-gray-500">
                          {APP_CONFIG.CHAIN_SYMBOL}
                        </span>
                        {errors.limit?.max && <p className="mt-1 text-xs text-red-400">{errors.limit.max.message}</p>}
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
            {amountMZD > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Max limit:{' '}
                <span className="font-medium text-gray-400">
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
