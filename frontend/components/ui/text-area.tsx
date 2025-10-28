import * as React from 'react';

import { cn } from '@/lib/utils';
interface TextareaProps extends React.ComponentProps<'textarea'> {
  label?: React.ReactNode;
}

function Textarea({ className, rows, label, ...props }: TextareaProps) {
  return (
    <label className="block">
      {label && <span className="text-primary text-xs tracking-[0.2em] uppercase dark:text-white">{label}</span>}
      <textarea
        rows={rows}
        data-slot="textarea"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-background border-input resize-vertical flex min-h-[80px] w-full min-w-0 rounded-md border bg-transparent px-3.5 py-2.5 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-2',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        {...props}
      />
    </label>
  );
}

export { Textarea };
