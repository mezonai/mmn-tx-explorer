'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { P2POrder } from '../../types';
import { P2PService } from '../../api';
import { OrderStatus } from '../../types';
import { toast } from 'sonner';

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
  nextStatus = OrderStatus.PENDING,
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
      toast.success('You have notified the seller. Please wait for the confirmation');
    } catch (error) {
      toast.error('Failed to notify the seller. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (order.status !== OrderStatus.OPEN) {
    return null;
  }

  return (
    <div>
      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || disabled}
          className="bg-brand-primary shadow-primary/30 hover:bg-brand-primary/80 focus-visible:outline-primary dark:hover:bg-brand-primary/90 border-1px border-primary inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:shadow-none"        >
          <CheckCircle2 className="h-5 w-5" />
          {isSubmitting ? 'Processing...' : buttonText}
        </Button>
      </div>
      <div className="px-4 text-center text-sm text-gray-500 mt-2">
        Only click the button after you have successfully transferred the money.
      </div>
    </div >
  );
};