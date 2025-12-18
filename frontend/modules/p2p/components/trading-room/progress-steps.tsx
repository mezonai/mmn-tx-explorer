'use client';

import { P2POrder } from '../../types';
import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  order: P2POrder;
}

const steps = [
  { id: 1, label: 'Payment', status: 'OPEN' as const },
  { id: 2, label: 'Pending confirmation', status: 'PENDING' as const },
  { id: 3, label: 'Completed', status: 'COMPLETED' as const },
];

export const ProgressSteps = ({ order }: ProgressStepsProps) => {
  // Map order status to step index
  const getStepIndex = (status: string): number => {
    switch (status) {
      case 'OPEN':
        return 0;
      case 'PENDING':
        return 1;
      case 'CONFIRMED':
      case 'COMPLETED':
        return 2;
      default:
        return 0;
    }
  };

  const activeStepIndex = getStepIndex(order.status);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index <= activeStepIndex;
          const isCurrent = index === activeStepIndex;
          const isCompleted = index < activeStepIndex;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step circle and label */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold',
                    isActive ? 'bg-brand-primary text-white' : 'bg-gray-700 text-gray-400'
                  )}
                >
                  {isCompleted ? '✓' : step.id}
                </div>
                <div className={cn('text-xs font-medium text-center', isActive ? 'text-brand-primary' : 'text-gray-400')}>
                  {step.label}
                </div>
              </div>

              {/* Connecting line (except for last step) */}
              {index < steps.length - 1 && (
                <div className="relative mx-4 h-1 flex-1 rounded bg-gray-700">
                  <div
                    className={cn(
                      'absolute top-0 left-0 h-full rounded bg-brand-primary transition-all duration-500',
                      isCompleted ? 'w-full' : isCurrent ? 'w-1/2' : 'w-0'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
