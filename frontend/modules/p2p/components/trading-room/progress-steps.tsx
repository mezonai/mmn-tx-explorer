'use client';

import { P2POrder } from '../../types/p2p.types';
import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  order: P2POrder;
}

const steps = [
  { id: 1, label: 'Thanh toán', status: 'PAYMENT_PENDING' as const },
  { id: 2, label: 'Chờ xác nhận', status: 'WAIT_CONFIRM' as const },
  { id: 3, label: 'Hoàn tất', status: 'COMPLETED' as const },
];

export const ProgressSteps = ({ order }: ProgressStepsProps) => {
  // Map order status to step index
  const getStepIndex = (status: string): number => {
    switch (status) {
      case 'PAYMENT_PENDING':
        return 0;
      case 'WAIT_CONFIRM':
        return 1;
      case 'PAYMENT_CONFIRMED':
        return 1; // Also map PAYMENT_CONFIRMED to step 2 for backward compatibility
      case 'COMPLETED':
        return 2;
      default:
        return 0;
    }
  };

  const activeStepIndex = getStepIndex(order.status);

  return (
    <div className="flex justify-between items-center mb-8 px-4">
      {steps.map((step, index) => {
        const isActive = index <= activeStepIndex;
        const isCurrent = index === activeStepIndex;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-700 text-gray-400'
              )}
            >
              {step.id}
            </div>
            <div
              className={cn(
                'text-xs font-bold',
                isActive ? 'text-brand-primary' : 'text-gray-400'
              )}
            >
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div className="h-1 flex-1 bg-gray-700 mx-2 rounded relative -mt-4">
                {isActive && (
                  <div
                    className={cn(
                      'absolute top-0 left-0 h-full rounded bg-brand-primary',
                      isCurrent ? 'w-1/2' : 'w-full'
                    )}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

