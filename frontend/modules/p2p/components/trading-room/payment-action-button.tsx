'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { P2POrder } from '../../types';

interface PaymentActionButtonProps {
  order: P2POrder;
  onPaymentConfirmed?: () => void;
}

export const PaymentActionButton = ({ order, onPaymentConfirmed }: PaymentActionButtonProps) => {
  console.log('🔍 [PaymentActionButton] Component rendered with order:', {
    order_id: order?.order_id,
    status: order?.status,
    order_status_type: typeof order?.status,
    will_show_button: order?.status === 'OPEN',
    full_order: order,
  });

  const handleConfirm = () => {
    // TODO: Call API to confirm payment
    onPaymentConfirmed?.();
  };

  if (order.status !== 'OPEN') {
    console.log('❌ [PaymentActionButton] Not showing button - status is not OPEN:', order.status);
    return null;
  }

  console.log('✅ [PaymentActionButton] Showing button - status is OPEN');
  return (
    <div>
      <Button
        onClick={handleConfirm}
        className="bg-brand-primary mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-600"
      >
        <CheckCircle2 className="h-5 w-5" />
        Đã chuyển tiền, thông báo cho người bán
      </Button>
      <div className="px-4 text-center text-sm text-gray-500">
        Chỉ ấn nút trên khi bạn đã thực sự chuyển khoản thành công.{' '}
        <a href="#" className="text-brand-primary ml-1 hover:underline">
          Cần trợ giúp?
        </a>
      </div>
    </div>
  );
};
