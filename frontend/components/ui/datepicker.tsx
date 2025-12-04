'use client';

import React, { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/datepicker.css';
import { DATE_PICKER_FORMAT } from '@/constant';

interface DatePickerProps {
  selected?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (date: Date | null) => void;
  className?: string;
  placeholder?: string;
  dateFormat?: string;
  showTimeSelect?: boolean;
  timeFormat?: string;
  timeIntervals?: number;
  showMonthDropdown?: boolean;
  showYearDropdown?: boolean;
  dropdownMode?: 'scroll' | 'select';
}

const DatePicker = forwardRef<ReactDatePicker, DatePickerProps>(
  ({ className, placeholder = 'Select date', onChange, dateFormat = DATE_PICKER_FORMAT, ...props }, ref) => {
    return (
      <div className="relative">
        <ReactDatePicker
          ref={ref}
          onChange={(date) => onChange?.(date as Date | null)}
          className={cn(
            'border-input bg-background text-foreground flex w-full min-w-0 rounded-lg border px-3.5 py-3 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-gray-500',
            'focus:ring-primary dark:focus:ring-primary-light focus:ring-1 focus:outline-none',
            'file:text-foreground file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'selection:bg-primary selection:text-primary-foreground',
            'transition-all',
            className
          )}
          placeholderText={placeholder}
          dateFormat={dateFormat}
          autoComplete="off"
          {...props}
        />
        <CalendarIcon className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
