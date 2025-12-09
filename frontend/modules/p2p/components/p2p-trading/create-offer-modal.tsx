'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Send, Loader2 } from 'lucide-react';
import { TradeTypeSection } from './create-offer-form/trade-type-section';
import { AmountSection } from './create-offer-form/amount-section';
import { PaymentSection } from './create-offer-form/payment-section';
import { CreateOfferFormState, CreateOfferRequest, TradeTypes } from '../../types';
import { useCreateOffer } from '../../hooks/useCreateOffer';

interface FormErrors {
  quantity?: string;
  price_rate?: string;
  account_number?: string;
  account_name?: string;
}

interface CreateOfferModalProps {
  onSubmit?: (data: CreateOfferRequest) => void;
}

export const CreateOfferModal = ({ onSubmit }: CreateOfferModalProps) => {
  const [open, setOpen] = useState(false);

  const { mutate: createOffer, isPending } = useCreateOffer();

  const [formData, setFormData] = useState<CreateOfferFormState>({
    side: TradeTypes.SELL,
    quantity: 0,
    price_rate: 1,
    limit: { min: 0, max: 0 },
    metadata: { bank: 'MB', account_name: '', account_number: '' },
    symbol: 'MZD',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [limitErrors, setLimitErrors] = useState<{ min?: string; max?: string }>({});

  useEffect(() => {
    if (open) {
      setFormData({
        side: TradeTypes.SELL,
        quantity: 0,
        price_rate: 1,
        limit: { min: 0, max: 0 },
        metadata: { bank: 'MB', account_name: '', account_number: '' },
        symbol: 'MZD',
      });
      setErrors({});
      setLimitErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const newLimitErrors: { min?: string; max?: string } = {};

    // Validate Quantity
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Please enter the amount of MZD to sell';
    }

    // Validate Price Rate
    if (formData.side === TradeTypes.SELL && formData.price_rate <= 0) {
      newErrors.price_rate = 'Please enter the selling rate';
    }

    // Validate Limits
    if (formData.side === TradeTypes.SELL) {
      // Min Limit Validation
      if (formData.limit.min <= 0) {
        newLimitErrors.min = 'Please enter the minimum limit';
      } else if (formData.limit.min > formData.quantity) {
        newLimitErrors.min = 'Minimum limit cannot exceed the sell quantity';
      }

      // Max Limit Validation
      if (formData.limit.max <= 0) {
        newLimitErrors.max = 'Please enter the maximum limit';
      } else if (formData.limit.max > formData.quantity) {
        newLimitErrors.max = 'Maximum limit cannot exceed the sell quantity';
      } else if (formData.limit.max < formData.limit.min) {
        newLimitErrors.max = 'Maximum limit must be greater than or equal to minimum limit';
      }
    }

    // Validate Metadata (Account Number)
    if (!formData.metadata.account_number.trim()) {
      newErrors.account_number = 'Please enter the account number';
    } else if (!/^\d+$/.test(formData.metadata.account_number.trim())) {
      newErrors.account_number = 'Account number must contain only digits';
    }

    // Validate Metadata (Account Name)
    if (!formData.metadata.account_name.trim()) {
      newErrors.account_name = 'Please enter the account name';
    }

    setErrors(newErrors);
    setLimitErrors(newLimitErrors);

    return Object.keys(newErrors).length === 0 && Object.keys(newLimitErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const payload: CreateOfferRequest = {
        ...formData,
        quantity: formData.quantity.toString(),
        price_rate: formData.price_rate.toString(),
        limit: {
          min: formData.limit.min.toString(),
          max: formData.limit.max.toString(),
        },
      };

      createOffer(payload, {
        onSuccess: () => {
          if (onSubmit) {
            onSubmit(payload);
          }
          console.log(payload);
          setOpen(false);
        },
        onError: (error) => {
          console.error('Error creating offer:', error);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand-primary hover:bg-brand-primary/90 h-10 w-full shrink-0 rounded-lg font-bold text-white shadow-sm transition-all md:w-auto md:px-5">
          <Plus className="mr-2 h-4 w-4" />
          New Offer
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl overflow-y-auto border-gray-300 dark:border-gray-800">
        <DialogHeader className="-mx-6 -mt-6 border-b border-gray-800 bg-gray-900/50 px-6 py-4 dark:bg-gray-900/50">
          <DialogTitle className="text-lg font-bold text-white">Create New Offer</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-3">
          <TradeTypeSection
            tradeType={formData.side}
            onTradeTypeChange={(type) => setFormData({ ...formData, side: type })}
            exchangeRate={formData.price_rate}
            onExchangeRateChange={(rate) => setFormData({ ...formData, price_rate: rate })}
            limit={formData.limit}
            onLimitChange={(limit) => setFormData({ ...formData, limit })}
            amountMZD={formData.quantity}
            limitErrors={limitErrors}
          />

          <AmountSection
            amountMZD={formData.quantity}
            onAmountChange={(amount) => setFormData({ ...formData, quantity: amount })}
            exchangeRate={formData.price_rate}
            error={errors.quantity}
          />

          <PaymentSection
            bank={formData.metadata.bank}
            accountNumber={formData.metadata.account_number}
            accountName={formData.metadata.account_name}
            onBankChange={(bank) => setFormData((prev) => ({ ...prev, metadata: { ...prev.metadata, bank } }))}
            onAccountNumberChange={(account) =>
              setFormData((prev) => ({ ...prev, metadata: { ...prev.metadata, account_number: account } }))
            }
            onAccountNameChange={(name) =>
              setFormData((prev) => ({ ...prev, metadata: { ...prev.metadata, account_name: name } }))
            }
            error={errors.account_number}
            accountNameError={errors.account_name}
          />
        </div>

        <DialogFooter className="-mx-6 -mb-6 flex justify-end gap-3 border-t border-gray-800 bg-gray-900/30 px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="px-5 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-brand-primary flex items-center gap-2 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-600 disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3 w-3" />}
            {isPending ? 'Creating...' : 'Create Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
