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
    <div className="mb-8 flex items-center justify-between px-4">
      {steps.map((step, index) => {
        const isActive = index <= activeStepIndex;
        const isCurrent = index === activeStepIndex;

        return (
          <div key={step.id} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                isActive ? 'bg-brand-primary text-white' : 'bg-gray-700 text-gray-400'
              )}
            >
              {step.id}
            </div>
            <div className={cn('text-xs font-bold', isActive ? 'text-brand-primary' : 'text-gray-400')}>
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div className="relative mx-2 -mt-4 h-1 flex-1 rounded bg-gray-700">
                {isActive && (
                  <div
                    className={cn(
                      'bg-brand-primary absolute top-0 left-0 h-full rounded',
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
