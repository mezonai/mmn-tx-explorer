'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreateOfferFormData } from '../types/p2p.types';
import { TradeTypeSection } from './create-offer-form/trade-type-section';
import { AmountSection } from './create-offer-form/amount-section';
import { PaymentSection } from './create-offer-form/payment-section';
import { Send } from 'lucide-react';

interface CreateOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: CreateOfferFormData) => void;
}

export const CreateOfferModal = ({ open, onOpenChange, onSubmit }: CreateOfferModalProps) => {
  const [formData, setFormData] = useState<CreateOfferFormData>({
    tradeType: 'SELL',
    amountMZD: 0,
    bank: 'MB',
    accountNumber: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateOfferFormData, string>>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        tradeType: 'SELL',
        amountMZD: 0,
        bank: 'MB',
        accountNumber: '',
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateOfferFormData, string>> = {};

    if (formData.amountMZD <= 0) {
      newErrors.amountMZD = 'Vui lòng nhập số lượng MZD muốn bán';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Vui lòng nhập số tài khoản';
    } else if (!/^\d+$/.test(formData.accountNumber.trim())) {
      newErrors.accountNumber = 'Số tài khoản chỉ được chứa số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit?.(formData);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto border-gray-300 dark:border-gray-800">
        <DialogHeader className="bg-gray-900/50 dark:bg-gray-900/50 -mx-6 -mt-6 px-6 py-4 border-b border-gray-800">
          <DialogTitle className="text-lg font-bold text-white">Đăng quảng cáo mới</DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            Tạo lệnh mua/bán MZD (Tỷ giá 1:1)
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Phần 1: Loại lệnh & Tài sản */}
          <TradeTypeSection
            tradeType={formData.tradeType}
            onTradeTypeChange={(type) => setFormData({ ...formData, tradeType: type })}
          />

          {/* Phần 2: Khối lượng giao dịch */}
          <AmountSection
            amountMZD={formData.amountMZD}
            onAmountChange={(amount) => setFormData({ ...formData, amountMZD: amount })}
            error={errors.amountMZD}
          />

          {/* Phần 3: Thanh toán */}
          <PaymentSection
            bank={formData.bank}
            accountNumber={formData.accountNumber}
            onBankChange={(bank) => setFormData({ ...formData, bank })}
            onAccountNumberChange={(account) => setFormData({ ...formData, accountNumber: account })}
            error={errors.accountNumber}
          />
        </div>

        <DialogFooter className="border-t border-gray-800 bg-gray-900/30 -mx-6 -mb-6 px-4 py-4 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 font-medium"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-brand-primary hover:bg-violet-600 text-white font-bold text-sm px-8 py-2 shadow-lg shadow-violet-900/20 transition flex items-center gap-2"
          >
            <Send className="h-3 w-3" />
            Đăng Quảng Cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

