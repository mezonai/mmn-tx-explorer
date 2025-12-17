'use client';

import { Control, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Info, User } from 'lucide-react';
import { BankOption } from '@/modules/p2p/types';
import { CreateOfferFormValues } from './validation-schema';
import { cn } from '@/lib/utils';

interface PaymentSectionProps {
  control: Control<CreateOfferFormValues>;
}

const bankOptions: { value: BankOption; label: string }[] = [
  { value: 'MB', label: 'MB Bank' },
  { value: 'VCB', label: 'Vietcombank' },
  { value: 'TCB', label: 'Techcombank' },
  { value: 'ACB', label: 'ACB' },
  { value: 'TPBANK', label: 'TPBank' },
  { value: 'VIETCOMBANK', label: 'Vietcombank' },
];

export const PaymentSection = ({ control }: PaymentSectionProps) => {
  return (
    <div className="space-y-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="bg-card text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs">
          3
        </span>
        <span className="text-foreground">Payment</span>
      </h3>

      {/* Select Bank */}
      <div>
        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Bank Name</label>
        <Controller
          control={control}
          name="bank_info.bank"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="border-border bg-input text-foreground w-full cursor-pointer rounded-md border px-3 py-2.5 text-sm focus:outline-none">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {bankOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Account Number */}
      <div>
        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Account Number</label>
        <div className="relative">
          <Controller
            control={control}
            name="bank_info.account_number"
            render={({ field, fieldState: { error } }) => (
              <>
                <Input
                  {...field}
                  type="text"
                  placeholder="Enter account number"
                  className={cn(
                    'bg-input/30 text-foreground w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none',
                    error ? 'border-utility-error-600' : 'border-border'
                  )}
                />
                <div className="text-muted-foreground absolute top-3.5 right-3">
                  <CreditCard className="text-muted-foreground h-3 w-3" />
                </div>
                {error && <p className="text-utility-error-600 mt-1 text-xs">{error.message}</p>}{' '}
              </>
            )}
          />
        </div>
      </div>

      {/* Account Name */}
      <div>
        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Account Name</label>
        <div className="relative">
          <Controller
            control={control}
            name="bank_info.account_name"
            render={({ field, fieldState: { error } }) => (
              <>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  type="text"
                  placeholder="Enter account owner name"
                  className={cn(
                    'bg-input/30 text-foreground w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none',
                    error ? 'border-utility-error-600' : 'border-border'
                  )}
                />
                <div className="text-muted-foreground absolute top-3.5 right-3">
                  <User className="text-muted-foreground h-3 w-3" />
                </div>
                {error && <p className="text-utility-error-600 mt-1 text-xs">{error.message}</p>}
              </>
            )}
          />
        </div>
      </div>

      <div className="border-brand-primary bg-card mt-2 rounded border p-3">
        <p className="flex items-start gap-2 text-xs leading-relaxed">
          <Info className="text-brand-primary mt-0.5 h-3 w-3 shrink-0" />
          <span className="text-muted-foreground">
            {' '}
            Note: Please ensure the Account Name entered matches exactly the bank account holder&apos;s name.
          </span>
        </p>
      </div>
    </div>
  );
};
