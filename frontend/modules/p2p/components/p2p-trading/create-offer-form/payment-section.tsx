import { useEffect, useState, useMemo } from 'react';
import { Control, Controller, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CreditCard, Info, User, Loader2 } from 'lucide-react';
import { BankOption, UserPaymentInfo } from '@/modules/p2p/types';
import { CreateOfferFormValues } from './validation-schema';
import { cn } from '@/lib/utils';
import { useUserPaymentInfos, useUpdatePaymentInfo } from '@/modules/p2p/hooks/usePaymentInfo';
import { toast } from 'sonner';

interface PaymentSectionProps {
  control: Control<CreateOfferFormValues>;
  setValue: UseFormSetValue<CreateOfferFormValues>;
  watch: UseFormWatch<CreateOfferFormValues>;
  onUnsavedChangesChange: (hasUnsavedChanges: boolean) => void;
}

const bankOptions: { value: BankOption; label: string }[] = [
  { value: 'MB', label: 'MB Bank' },
  { value: 'VCB', label: 'Vietcombank' },
  { value: 'TCB', label: 'Techcombank' },
  { value: 'ACB', label: 'ACB' },
  { value: 'TPBANK', label: 'TPBank' },
  { value: 'VIETCOMBANK', label: 'Vietcombank' },
];

export const PaymentSection = ({ control, setValue, watch, onUnsavedChangesChange }: PaymentSectionProps) => {
  const { data: savedPayments, isLoading } = useUserPaymentInfos();
  const { mutate: updatePayment, isPending: isUpdating } = useUpdatePaymentInfo();
  const [isInitialized, setIsInitialized] = useState(false);

  const currentBank = watch('bank_info.bank');
  const currentAccountNumber = watch('bank_info.account_number');
  const currentAccountName = watch('bank_info.account_name');

  // Find saved info for the currently selected bank mapping to BankOption labels
  const matchedSavedInfo = useMemo(() => {
    if (!savedPayments) return null;
    const currentBankLabel = bankOptions.find((b) => b.value === currentBank)?.label;
    return savedPayments.find((p) => p.bank_name === currentBankLabel) || null;
  }, [savedPayments, currentBank]);

  const hasChanges = useMemo(() => {
    if (!matchedSavedInfo) {
      // If no saved info for this bank, and inputs are not empty, we consider it "unsaved"
      return !!(currentAccountNumber || currentAccountName);
    }
    return (
      currentAccountNumber !== matchedSavedInfo.account_number || currentAccountName !== matchedSavedInfo.account_name
    );
  }, [matchedSavedInfo, currentAccountNumber, currentAccountName]);

  useEffect(() => {
    onUnsavedChangesChange(hasChanges);
  }, [hasChanges, onUnsavedChangesChange]);

  // Initial fill: find primary or first bank info
  useEffect(() => {
    if (!isInitialized && savedPayments && savedPayments.length > 0) {
      const primary = savedPayments.find((p) => p.is_primary) || savedPayments[0];
      const bankOpt = bankOptions.find((opt) => opt.label === primary.bank_name);
      if (bankOpt) {
        setValue('bank_info.bank', bankOpt.value);
        setValue('bank_info.account_number', primary.account_number);
        setValue('bank_info.account_name', primary.account_name);
        setIsInitialized(true);
      }
    }
  }, [savedPayments, setValue, isInitialized]);

  const handleBankChange = (value: BankOption) => {
    setValue('bank_info.bank', value);
    const bankLabel = bankOptions.find((opt) => opt.value === value)?.label;
    const saved = savedPayments?.find((p) => p.bank_name === bankLabel);
    if (saved) {
      setValue('bank_info.account_number', saved.account_number);
      setValue('bank_info.account_name', saved.account_name);
    } else {
      setValue('bank_info.account_number', '');
      setValue('bank_info.account_name', '');
    }
  };

  const handleSaveChanges = () => {
    const bankLabel = bankOptions.find((b) => b.value === currentBank)?.label || currentBank;
    updatePayment(
      {
        bank_name: bankLabel,
        account_number: currentAccountNumber,
        account_name: currentAccountName,
      },
      {
        onSuccess: () => {
          toast.success('Payment information saved');
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to save payment information');
        },
      }
    );
  };

  const handleCancel = () => {
    if (matchedSavedInfo) {
      setValue('bank_info.account_number', matchedSavedInfo.account_number);
      setValue('bank_info.account_name', matchedSavedInfo.account_name);
    } else {
      setValue('bank_info.account_number', '');
      setValue('bank_info.account_name', '');
    }
  };

  return (
    <div className="space-y-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <span className="bg-card text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs">
            3
          </span>
          <span className="text-foreground">Payment</span>
        </h3>

        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
              className="text-muted-foreground h-8 text-xs hover:bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveChanges}
              disabled={isUpdating || !currentAccountNumber || !currentAccountName}
              className="bg-brand-primary h-8 rounded-md px-3 text-xs font-bold text-white shadow-sm"
            >
              {isUpdating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Select Bank */}
      <div>
        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Bank Name</label>
        <Controller
          control={control}
          name="bank_info.bank"
          render={({ field }) => (
            <Select onValueChange={handleBankChange} value={field.value}>
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
                  maxLength={20}
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
                  maxLength={50}
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
