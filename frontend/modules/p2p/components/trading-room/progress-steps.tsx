'use client';

import { OrderStatus, P2POrder, PROGRESS_STEPS } from '../../types';
import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  order: P2POrder;
}

export const ProgressSteps = ({ order }: ProgressStepsProps) => {
  // Map order status to step index
  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case OrderStatus.OPEN:
        return 0;
      case OrderStatus.PENDING:
        return 1;
      case OrderStatus.CONFIRMED:
      case OrderStatus.COMPLETED:
        return 2;
      default:
        return 0;
    }
  };

  const activeStepIndex = getStepIndex(order.status);

  return (
    <div className="mb-4 px-2">
      <div className="flex items-start justify-between">
        {PROGRESS_STEPS.map((step, index) => {
          const isActive = index <= activeStepIndex;
          const isCurrent = index === activeStepIndex;
          const isCompleted = index < activeStepIndex;

          return (
            <div key={step.id} className={cn('flex items-center', index < PROGRESS_STEPS.length - 1 ? 'flex-1' : '')}>
              {/* Step circle and label */}
              <div className="flex flex-col items-center gap-1.5 md:gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full text-xs md:text-sm font-bold',
                    'h-7 w-7 md:h-8 md:w-8',
                    isActive ? 'bg-brand-primary text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? '✓' : step.id}
                </div>
                <div className={cn(
                  'text-[10px] md:text-xs font-medium text-center max-w-[60px] md:max-w-none leading-tight',
                  isActive ? 'text-brand-primary' : 'text-muted-foreground'
                )}>
                  {step.label}
                </div>
              </div>

              {/* Connecting line (except for last step) */}
              {index < PROGRESS_STEPS.length - 1 && (
                <div className="relative mx-2 md:mx-4 h-1.5 md:h-2 flex-1 rounded bg-gray-400 self-start mt-3 md:mt-3.5">
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