'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { P2POrder } from '../../types';

interface SellerConfirmButtonProps {
  order: P2POrder;
  onConfirm?: () => void;
}

export const SellerConfirmButton = ({ order, onConfirm }: SellerConfirmButtonProps) => {
  const handleConfirm = () => {
    // TODO: Call API to confirm payment received
    onConfirm?.();
  };

  if (order.order_status !== 'PENDING') {
    return null;
  }

  return (
    <div>
      <Button
        onClick={handleConfirm}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-600"
      >
        <CheckCircle2 className="h-5 w-5" />
        Xác nhận đã nhận được tiền, chuyển MZD
      </Button>
      <div className="px-4 text-center text-sm text-gray-500">
        Chỉ ấn nút trên khi bạn đã thực sự nhận được tiền chuyển khoản từ người mua.
      </div>
    </div>
  );
};
