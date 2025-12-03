'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { P2POrder } from '../../types/p2p.types';

interface SellerConfirmButtonProps {
  order: P2POrder;
  onConfirm?: () => void;
}

export const SellerConfirmButton = ({ order, onConfirm }: SellerConfirmButtonProps) => {
  const handleConfirm = () => {
    // TODO: Call API to confirm payment received
    onConfirm?.();
  };

  if (order.status !== 'WAIT_CONFIRM') {
    return null;
  }

  return (
    <div>
      <Button
        onClick={handleConfirm}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition mb-4 flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="h-5 w-5" />
        Xác nhận đã nhận được tiền, chuyển MZD
      </Button>
      <div className="text-center text-sm text-gray-500 px-4">
        Chỉ ấn nút trên khi bạn đã thực sự nhận được tiền chuyển khoản từ người mua.
      </div>
    </div>
  );
};

