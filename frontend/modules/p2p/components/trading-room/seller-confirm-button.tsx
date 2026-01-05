'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { P2POrder } from '../../types';
import { APP_CONFIG } from '@/configs/app.config';
import { OrderStatus } from '../../types';
import { SellerConfirmReleaseModal } from './seller-confirm-release-modal';
import { toast } from 'sonner';

interface SellerConfirmButtonProps {
  order: P2POrder;
  onConfirm?: () => Promise<void> | void;
  disabled?: boolean;
}

export const SellerConfirmButton = ({ order, onConfirm, disabled = false }: SellerConfirmButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleButtonClick = () => {
    if (!isSubmitting && !disabled) {
      setShowConfirmModal(true);
    }
  };

  const handleFinalConfirm = async () => {
    if (isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      await onConfirm?.();
      toast.success(`Payment confirmed. ${APP_CONFIG.CHAIN_SYMBOL} has been released to the buyer.`);
      setShowConfirmModal(false);
    } catch (error) {
      toast.error('Failed to confirm payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (order.status !== OrderStatus.PENDING) {
    return null;
  }

  return (
    <div>
      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleButtonClick}
          disabled={isSubmitting || disabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-6 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 md:text-base"
        >
          <CheckCircle2 className="h-5 w-5" />
          {isSubmitting ? 'Confirming...' : `Confirm money received, release ${APP_CONFIG.CHAIN_SYMBOL}`}
        </Button>
      </div>
      <div className="text-muted-foreground mt-2 px-4 text-center text-sm">
        Only click the button after you have received the transfer from the buyer.
      </div>

      <SellerConfirmReleaseModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        amountToRelease={order.amount}
        amountReceived={order.amount * order.price_rate}
        onConfirm={handleFinalConfirm}
        isLoading={isSubmitting}
      />
    </div>
  );
};
