'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { P2POrder } from '../../types';
import { APP_CONFIG } from '@/configs/app.config';

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
      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || disabled}
          className="rounded-lg bg-emerald-500 px-6 py-2 font-bold text-white transition hover:bg-emerald-600"
        >
          <CheckCircle2 className="h-5 w-5" />
          {isSubmitting ? 'Confirming...' : `Confirm money received, release ${APP_CONFIG.CHAIN_SYMBOL}`}
        </Button>
      </div>
      <div className="px-4 text-center text-sm text-muted-foreground mt-2">
        Only click the button after you have received the transfer from the buyer.
      </div>
    </div>
  );
};