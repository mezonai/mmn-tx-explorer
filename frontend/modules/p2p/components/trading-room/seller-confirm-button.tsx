'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { P2POrder } from '../../types';

interface SellerConfirmButtonProps {
  order: P2POrder;
  onConfirm?: () => Promise<void> | void;
  disabled?: boolean;
}

export const SellerConfirmButton = ({ order, onConfirm, disabled = false }: SellerConfirmButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      await onConfirm?.();
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (order.status !== 'PENDING') {
    return null;
  }

  return (
    <div>
      <Button
        onClick={handleConfirm}
        disabled={isSubmitting || disabled}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <CheckCircle2 className="h-5 w-5" />
        {isSubmitting ? 'Confirming...' : 'Confirm money received, release MZD'}
      </Button>
      <div className="px-4 text-center text-sm text-muted-foreground">
        Only click the button after you have received the transfer from the buyer.
      </div>
    </div>
  );
};