'use client';

import { Button } from '@/components/ui/button';
import { EXPIRY_OPTIONS } from '../../../constants';
import { useFormContext } from 'react-hook-form';
import { CreateRedEnvelopeForm } from '@/modules/lucky-money/type';

export function ExpirySettings() {
  const { watch, setValue } = useFormContext<CreateRedEnvelopeForm>();

  const currentExpiry = watch('expiryHours');

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 sm:mt-6 sm:rounded-2xl sm:p-3 md:p-4 dark:border-[#ff496e40] dark:bg-[#2a2342] dark:text-[#ffb84d]">
      <p className="text-xs font-semibold text-amber-700 sm:text-sm dark:text-[#ffb84d]">Expiry</p>

      <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2 md:gap-3">
        {EXPIRY_OPTIONS.map((option) => {
          const isActive = currentExpiry === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              onClick={() => setValue('expiryHours', option.value, { shouldValidate: true })}
              size="sm"
              className={`rounded-lg border px-3 py-1.5 text-xs transition duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                isActive
                  ? 'border-amber-600 bg-amber-100 text-amber-700 dark:border-[#ffb84d] dark:bg-transparent dark:text-[#ffb84d]'
                  : 'border-amber-300 text-amber-600 hover:border-amber-400 hover:text-amber-700 dark:border-[#ffb84d33] dark:text-[#ffb84d99] dark:hover:border-[#ffb84d66] dark:hover:text-[#ffb84d]'
              } bg-transparent dark:bg-transparent`}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-amber-600 sm:mt-3 dark:text-[#ffb84d99]">
        Expired sessions display "out of lucky money" to unclaimed participants.
      </p>
    </div>
  );
}
