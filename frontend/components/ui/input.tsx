import * as React from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentProps<'input'> {
  label?: React.ReactNode;
  suffix?: React.ReactNode;
}

function Input({ className, type, label, suffix, ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="text-primary text-xs tracking-[0.2em] uppercase dark:text-white">{label}</span>}
      <div className="relative">
        <input
          type={type}
          data-slot="input"
          className={cn(
            'border-input bg-background text-foreground flex w-full min-w-0 rounded-lg border px-3.5 py-3 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-gray-500',
            'focus:ring-primary dark:focus:ring-primary-light focus:ring-1 focus:outline-none',
            'file:text-foreground file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'selection:bg-primary selection:text-primary-foreground',
            'transition-all',
            suffix && 'pr-24',
            className
          )}
          {...props}
        />
        {suffix ? (
          <div className="pointer-events-none absolute inset-y-0 top-[6%] right-0 flex items-center pr-3">
            <span aria-hidden="true" className="mx-3 h-9 w-px bg-gray-300" />
            <span className="text-base font-semibold text-gray-500">{suffix}</span>
          </div>
        ) : null}
      </div>
    </label>
  );
}

export { Input };
