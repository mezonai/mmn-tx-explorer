'use client';

import { Button } from '@/components/ui/button';
import { EXPIRY_OPTIONS } from '../../../constants';
import { useFormContext } from 'react-hook-form';
import { CreateRedEnvelopeForm } from '@/modules/lucky-money/type';

export function ExpirySettings() {
  const { watch, setValue } = useFormContext<CreateRedEnvelopeForm>();

  const currentExpiry = watch('expiryHours');

  return (
    <div className="dark:border-destructive/25 dark:bg-midnight-violet mt-4 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 sm:mt-6 sm:rounded-2xl sm:p-3 md:p-4 dark:text-amber-400">
      <p className="text-xs font-semibold text-amber-700 sm:text-sm dark:text-amber-400">Expiry</p>

      <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2 md:gap-3">
        {EXPIRY_OPTIONS.map((option) => {
          const isActive = currentExpiry === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              onClick={() => setValue('expiryHours', option.value, { shouldValidate: true })}
              size="sm"
              className={`rounded-lg border px-3 py-1.5 text-xs transition duration-200 hover:bg-transparent sm:px-4 sm:py-2 sm:text-sm dark:hover:bg-transparent ${
                isActive
                  ? 'border-amber-600 bg-amber-100 text-amber-700 dark:border-amber-400 dark:bg-transparent dark:text-amber-400'
                  : 'border-amber-300 text-amber-400 hover:border-amber-600 hover:text-amber-700 dark:border-amber-400/50 dark:text-amber-400/50 dark:hover:border-amber-400 dark:hover:text-amber-400'
              } bg-transparent dark:bg-transparent`}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-amber-600 sm:mt-3 dark:text-amber-400/50">
        Expired sessions display &ldquo;out of lucky money&ldquo; to unclaimed participants.
      </p>
    </div>
  );
}
