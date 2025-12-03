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
    exchangeRate: 1, // Default 1:1
    limit: {
      min: 0,
      max: 0,
    },
    bank: 'MB',
    accountNumber: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateOfferFormData, string>>>({});
  const [limitErrors, setLimitErrors] = useState<{ min?: string; max?: string }>({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        tradeType: 'SELL',
        amountMZD: 0,
        exchangeRate: 1,
        limit: {
          min: 0,
          max: 0,
        },
        bank: 'MB',
        accountNumber: '',
      });
      setErrors({});
      setLimitErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateOfferFormData, string>> = {};
    const newLimitErrors: { min?: string; max?: string } = {};

    if (formData.amountMZD <= 0) {
      newErrors.amountMZD = 'Vui lòng nhập số lượng MZD muốn bán';
    }

    if (formData.tradeType === 'SELL' && formData.exchangeRate <= 0) {
      newErrors.exchangeRate = 'Vui lòng nhập tỉ giá bán';
    }

    // Validate limit
    if (formData.tradeType === 'SELL') {
      if (formData.limit.min <= 0) {
        newLimitErrors.min = 'Vui lòng nhập giới hạn tối thiểu';
      } else if (formData.limit.min > formData.amountMZD) {
        newLimitErrors.min = 'Giới hạn tối thiểu không được lớn hơn số MZD muốn bán';
      }

      if (formData.limit.max <= 0) {
        newLimitErrors.max = 'Vui lòng nhập giới hạn tối đa';
      } else if (formData.limit.max > formData.amountMZD) {
        newLimitErrors.max = 'Giới hạn tối đa không được lớn hơn số MZD muốn bán';
      } else if (formData.limit.max < formData.limit.min) {
        newLimitErrors.max = 'Giới hạn tối đa phải lớn hơn hoặc bằng giới hạn tối thiểu';
      }
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Vui lòng nhập số tài khoản';
    } else if (!/^\d+$/.test(formData.accountNumber.trim())) {
      newErrors.accountNumber = 'Số tài khoản chỉ được chứa số';
    }

    setErrors(newErrors);
    setLimitErrors(newLimitErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newLimitErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('📝 Create Offer Data:', {
        tradeType: formData.tradeType,
        amountMZD: formData.amountMZD,
        amountMZDFormatted: new Intl.NumberFormat('vi-VN').format(formData.amountMZD),
        exchangeRate: formData.exchangeRate,
        exchangeRateDisplay: `1 MZD = ${formData.exchangeRate.toLocaleString('vi-VN')} VND`,
        totalVND: formData.amountMZD * formData.exchangeRate,
        totalVNDFormatted: new Intl.NumberFormat('vi-VN').format(formData.amountMZD * formData.exchangeRate),
        limit: {
          min: formData.limit.min,
          minFormatted: new Intl.NumberFormat('vi-VN').format(formData.limit.min),
          max: formData.limit.max,
          maxFormatted: new Intl.NumberFormat('vi-VN').format(formData.limit.max),
          range: `${new Intl.NumberFormat('vi-VN').format(formData.limit.min)} - ${new Intl.NumberFormat('vi-VN').format(formData.limit.max)} MZD`,
        },
        bank: formData.bank,
        accountNumber: formData.accountNumber,
      });

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
            Tạo lệnh mua/bán MZD với tỉ giá tùy chỉnh
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Phần 1: Loại lệnh & Tài sản */}
          <TradeTypeSection
            tradeType={formData.tradeType}
            onTradeTypeChange={(type) => setFormData({ ...formData, tradeType: type })}
            exchangeRate={formData.exchangeRate}
            onExchangeRateChange={(rate) => setFormData({ ...formData, exchangeRate: rate })}
            limit={formData.limit}
            onLimitChange={(limit) => setFormData({ ...formData, limit })}
            amountMZD={formData.amountMZD}
            limitErrors={limitErrors}
          />

          {/* Phần 2: Khối lượng giao dịch */}
          <AmountSection
            amountMZD={formData.amountMZD}
            onAmountChange={(amount) => setFormData({ ...formData, amountMZD: amount })}
            exchangeRate={formData.exchangeRate}
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

