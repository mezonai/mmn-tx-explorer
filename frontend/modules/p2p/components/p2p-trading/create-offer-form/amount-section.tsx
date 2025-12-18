'use client';

import { Control, Controller, UseFormTrigger, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { CreateOfferFormValues } from './validation-schema';
import { APP_CONFIG } from '@/configs/app.config';
import { cn } from '@/lib/utils';
import { AlertCircle, Lightbulb } from 'lucide-react';

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

// Validation logic for seller
const validateSellerAmounts = (amount: number, min: number, max: number) => {
  if (!amount || !min || !max) return null;

  // Check if remaining amount after max transaction is valid
  const remainingAfterMax = amount - max;

  // Case 1: Perfect match (no remaining)
  if (remainingAfterMax === 0) return null;

  // Case 2: Remaining is enough for another transaction
  if (remainingAfterMax >= min) return null;

  // Case 3: Check if amount can be divided evenly
  // Try to find if there's a valid transaction size that divides evenly
  for (let txAmount = min; txAmount <= max; txAmount++) {
    if (amount % txAmount === 0) return null;
  }

  // Invalid configuration - return suggestions
  const suggestions = [];

  // Suggestion 1: Increase amount to allow at least 2 max transactions
  const suggestAmount1 = Math.ceil(amount / max) * max;
  if (suggestAmount1 !== amount) {
    suggestions.push({
      type: 'amount',
      value: suggestAmount1,
      label: `Tăng Amount lên ${formatCurrency(suggestAmount1)} ${APP_CONFIG.CHAIN_SYMBOL}`
    });
  }

  // Suggestion 2: Decrease max to leave valid remaining
  const suggestMax = amount - min;
  if (suggestMax >= min && suggestMax !== max) {
    suggestions.push({
      type: 'max',
      value: suggestMax,
      label: `Giảm Maximum xuống ${formatCurrency(suggestMax)} ${APP_CONFIG.CHAIN_SYMBOL}`
    });
  }

  // Suggestion 3: Decrease min to match remaining
  if (remainingAfterMax > 0 && remainingAfterMax !== min) {
    suggestions.push({
      type: 'min',
      value: remainingAfterMax,
      label: `Giảm Minimum xuống ${formatCurrency(remainingAfterMax)} ${APP_CONFIG.CHAIN_SYMBOL}`
    });
  }

  return {
    isValid: false,
    remaining: remainingAfterMax,
    message: `Sau khi bán ${formatCurrency(max)} ${APP_CONFIG.CHAIN_SYMBOL}, sẽ còn lại ${formatCurrency(remainingAfterMax)} ${APP_CONFIG.CHAIN_SYMBOL} (nhỏ hơn Min ${formatCurrency(min)} ${APP_CONFIG.CHAIN_SYMBOL})`,
    suggestions
  };
};

export const AmountSection = ({ control, trigger, userBalance }: AmountSectionProps) => {
  const amountMZD = useWatch({ control, name: 'amount' });
  const exchangeRate = useWatch({ control, name: 'price_rate' });
  const minLimit = useWatch({ control, name: 'limit.min' });
  const maxLimit = useWatch({ control, name: 'limit.max' });

  const totalVND = parseFloat(exchangeRate) > 0 ? amountMZD * parseFloat(exchangeRate) : 0;

  // Validate seller amounts
  const validationResult = validateSellerAmounts(amountMZD, minLimit, maxLimit);

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
                    if (val > MAX_AMOUNT) return;
                    field.onChange(val);
                    trigger(['limit.min', 'limit.max']);
                  }}
                  type="text"
                  placeholder="Ex: 5,000,000"
                  className={cn(
                    'bg-input/30 w-full rounded-md border px-3 py-2.5 text-lg font-bold transition-colors focus:outline-none',
                    error || validationResult
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

        {/* Validation Warning */}
        {validationResult && (
          <div className="bg-utility-error-50 border-utility-error-200 mt-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-utility-error-600 h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-utility-error-900 text-sm font-medium">
                  Cảnh báo: Cấu hình không hợp lệ
                </p>
                <p className="text-utility-error-700 mt-1 text-xs">
                  {validationResult.message}
                </p>

                {validationResult.suggestions.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Lightbulb className="text-utility-warning-600 h-4 w-4" />
                      <span className="text-utility-error-900 text-xs font-medium">
                        Gợi ý điều chỉnh:
                      </span>
                    </div>
                    <div className="space-y-2">
                      {validationResult.suggestions.map((suggestion, idx) => (
                        <Controller
                          key={idx}
                          control={control}
                          name={
                            suggestion.type === 'amount'
                              ? 'amount'
                              : suggestion.type === 'max'
                                ? 'limit.max'
                                : 'limit.min'
                          }
                          render={({ field }) => (
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(suggestion.value);
                                trigger(['amount', 'limit.min', 'limit.max']);
                              }}
                              className="bg-utility-error-100 hover:bg-utility-error-200 text-utility-error-900 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition"
                            >
                              <span>• {suggestion.label}</span>
                              <span className="text-utility-error-600 text-[10px] font-medium">
                                Click để áp dụng
                              </span>
                            </button>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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