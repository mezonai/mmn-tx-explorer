'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { P2POrder } from '../../types';
import { P2PService } from '../../api';

interface PaymentActionButtonProps {
  order: P2POrder;
  /**
   * Status to send to the backend. Default: 'PENDING' (buyer has paid).
   * Can pass 'CONFIRMED' to reuse the component for the seller flow.
   */
  nextStatus?: string;
  /**
   * Button label. Default: "I have transferred, notify the seller"
   */
  buttonText?: string;
  /**
   * Callback after backend returns the updated order.
   */
  onStatusUpdated?: (order: P2POrder) => void;
  /**
   * Disable the button (e.g., when order has expired)
   */
  disabled?: boolean;
}

export const PaymentActionButton = ({
  order,
  nextStatus = 'PENDING',
  buttonText = 'I have transferred, notify the seller',
  onStatusUpdated,
  disabled = false,
}: PaymentActionButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      const updated = await P2PService.updateOrderStatus(String(order.order_id), nextStatus);
      const patchedOrder = updated || { ...order, status: nextStatus };
      onStatusUpdated?.(patchedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (order.status !== 'OPEN') {
    return null;
  }

  return (
    <div>
      <Button
        onClick={handleConfirm}
        disabled={isSubmitting || disabled}
        className="bg-brand-primary mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <CheckCircle2 className="h-5 w-5" />
        {isSubmitting ? 'Processing...' : buttonText}
      </Button>
      <div className="px-4 text-center text-sm text-gray-500">
        Only click the button after you have successfully transferred the money.{' '}
        <a href="#" className="text-brand-primary ml-1 hover:underline">
          Need help?
        </a>
      </div>
    </div>
  );
};