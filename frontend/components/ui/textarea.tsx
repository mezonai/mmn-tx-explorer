import * as React from 'react';

import { cn } from '@/lib/utils';
interface TextareaProps extends React.ComponentProps<'textarea'> {
  label?: React.ReactNode;
}

function Textarea({ className, rows, label, cols, ...props }: TextareaProps) {
  return (
    <label className="block">
      {label && <span className="text-primary text-xs tracking-[0.2em] uppercase dark:text-white">{label}</span>}
      <textarea
        rows={rows}
        cols={cols}
        data-slot="textarea"
        className={cn(
          'border-input bg-background text-foreground flex w-full min-w-0 rounded-lg border px-3.5 py-3 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-gray-500',
          'focus:ring-primary dark:focus:ring-primary-light focus:ring-1 focus:outline-none',
          'file:text-foreground file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'selection:bg-primary selection:text-primary-foreground',
          'transition-all',
          className
        )}
        {...props}
      />
    </label>
  );
}

export { Textarea };
