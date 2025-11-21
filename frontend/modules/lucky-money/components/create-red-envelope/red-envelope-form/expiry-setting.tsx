'use client';

import { Button } from '@/components/ui/button';
import { EXPIRY_OPTIONS } from '../../../constants';
import { useCreateRedEnvelopeContext } from '@/modules/lucky-money/context/CreateRedEnvelopeContext';

export function ExpirySettings() {
  const { form, updateField } = useCreateRedEnvelopeContext();

  return (
    <div
      className="
        mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-amber-200 dark:border-[#ff496e40]
        bg-amber-50 dark:bg-[#2a2342] p-2.5 sm:p-3 md:p-4 text-xs text-amber-700 dark:text-[#ffb84d]
      "
    >
      <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-[#ffb84d]">Expiry</p>

      <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
        {EXPIRY_OPTIONS.map((option) => {
          const isActive = form.expiryHours === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              onClick={() => updateField('expiryHours', option.value)}
              size="sm"
              className={`
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition duration-200 text-xs sm:text-sm
                ${
                  isActive
                    ? 'border-amber-600 dark:border-[#ffb84d] text-amber-700 dark:text-[#ffb84d] bg-amber-100 dark:bg-transparent'
                    : 'border-amber-300 dark:border-[#ffb84d33] text-amber-600 dark:text-[#ffb84d99] hover:border-amber-400 dark:hover:border-[#ffb84d66] hover:text-amber-700 dark:hover:text-[#ffb84d]'
                }
                bg-transparent dark:bg-transparent
              `}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      <p className="mt-2 sm:mt-3 text-xs text-amber-600 dark:text-[#ffb84d99] leading-relaxed">
        Expired sessions display "out of lucky money" to unclaimed participants.
      </p>
    </div>
  );
}
