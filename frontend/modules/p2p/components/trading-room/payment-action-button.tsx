'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { P2POrder } from '../../types';

interface PaymentActionButtonProps {
  order: P2POrder;
  onPaymentConfirmed?: () => void;
}

export const PaymentActionButton = ({ order, onPaymentConfirmed }: PaymentActionButtonProps) => {
  const handleConfirm = () => {
    // TODO: Call API to confirm payment
    onPaymentConfirmed?.();
  };

  if (order.order_status !== 'OPEN') {
    return null;
  }

  return (
    <div>
      <Button
        onClick={handleConfirm}
        className="w-full bg-brand-primary hover:bg-violet-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-violet-900/20 transition mb-4 flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="h-5 w-5" />
        Đã chuyển tiền, thông báo cho người bán
      </Button>
      <div className="text-center text-sm text-gray-500 px-4">
        Chỉ ấn nút trên khi bạn đã thực sự chuyển khoản thành công.{' '}
        <a href="#" className="text-brand-primary hover:underline ml-1">
          Cần trợ giúp?
        </a>
      </div>
    </div>
  );
};




