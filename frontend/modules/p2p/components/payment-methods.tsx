'use client';

import { PaymentMethod } from '../types/p2p.types';
import { cn } from '@/lib/utils';

interface PaymentMethodsProps {
  methods: PaymentMethod[];
}

const paymentMethodConfig: Record<PaymentMethod, { label: string; colorClass: string }> = {
  TPBANK: {
    label: 'TPBank',
    colorClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-500 dark:border-yellow-500/20',
  },
  MOMO: {
    label: 'Momo',
    colorClass: 'bg-pink-500/10 text-pink-500 border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-500 dark:border-pink-500/20',
  },
  VIETCOMBANK: {
    label: 'Vietcombank',
    colorClass: 'bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20',
  },
  BANK_TRANSFER: {
    label: 'Chuyển khoản NH',
    colorClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20',
  },
  ALL: {
    label: 'Tất cả',
    colorClass: 'bg-gray-500/10 text-gray-500 border-gray-500/20 dark:bg-gray-500/10 dark:text-gray-500 dark:border-gray-500/20',
  },
};

export const PaymentMethods = ({ methods }: PaymentMethodsProps) => {
  // Filter out 'ALL' as it's not a real payment method
  const realMethods = methods.filter((m) => m !== 'ALL');

  if (realMethods.length === 0) {
    return <span className="text-xs text-gray-400">N/A</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {realMethods.map((method) => {
        const config = paymentMethodConfig[method];
        if (!config) return null;

        return (
          <span
            key={method}
            className={cn(
              'rounded border px-2 py-1 text-xs font-medium',
              config.colorClass
            )}
          >
            {config.label}
          </span>
        );
      })}
    </div>
  );
};

