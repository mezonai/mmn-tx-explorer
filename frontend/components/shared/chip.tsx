import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const chipVariants = cva('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors', {
  variants: {
    variant: {
      default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
      success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
      warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
      error: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300',
      info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
      primary: 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light',
      secondary: 'bg-gray-500/10 text-gray-700 dark:bg-gray-400/10 dark:text-gray-300',
      brand: 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/10',
      // Outline variants with borders
      'outline-default': 'border border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300',
      'outline-success': 'border border-emerald-300 text-emerald-600 dark:border-emerald-500 dark:text-emerald-300',
      'outline-warning': 'border border-amber-300 text-amber-600 dark:border-amber-500 dark:text-amber-300',
      'outline-error': 'border border-red-300 text-red-600 dark:border-red-500 dark:text-red-300',
      'outline-info': 'border border-blue-300 text-blue-600 dark:border-blue-500 dark:text-blue-300',
      'outline-primary': 'border border-primary text-primary dark:border-primary-light dark:text-primary-light',
      'outline-secondary': 'border border-gray-400 text-gray-700 dark:border-gray-500 dark:text-gray-300',
      'outline-brand':
        'border border-brand-primary text-brand-primary dark:border-brand-primary dark:text-brand-primary',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-4 py-1.5 text-sm',
    },
  },
  compoundVariants: [
    // Add subtle background for outline variants on hover
    {
      variant: 'outline-default',
      className: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
    },
    {
      variant: 'outline-success',
      className: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/5',
    },
    {
      variant: 'outline-warning',
      className: 'hover:bg-amber-50 dark:hover:bg-amber-500/5',
    },
    {
      variant: 'outline-error',
      className: 'hover:bg-red-50 dark:hover:bg-red-500/5',
    },
    {
      variant: 'outline-info',
      className: 'hover:bg-blue-50 dark:hover:bg-blue-500/5',
    },
    {
      variant: 'outline-primary',
      className: 'hover:bg-primary/5 dark:hover:bg-primary/10',
    },
    {
      variant: 'outline-secondary',
      className: 'hover:bg-gray-50 dark:hover:bg-gray-500/5',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof chipVariants> {
  children: React.ReactNode;
}

export const Chip = ({ className, variant, size, children, ...props }: ChipProps) => {
  return (
    <span className={cn(chipVariants({ variant, size }), className)} {...props}>
      {children}
    </span>
  );
};
