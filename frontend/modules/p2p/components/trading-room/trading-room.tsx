'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useP2POffer } from '../../hooks/useP2POffer';
import { BuyAmountSection } from './buy-amount-section';
import { useCreateOrder } from '../../hooks/useCreateOrder';
import { OrderInfoCard } from './order-info-card';
import { BankInfoCard } from './bank-info-card';
import { PaymentActionButton } from './payment-action-button';
import { P2POrder } from '../../types/p2p.types';

interface TradingRoomProps {
  orderId: string;
  currentUserId?: string;
}

// Minimal TradingRoom: supports viewing offer details when URL contains ?type=offer
export const TradingRoom = ({ orderId }: TradingRoomProps) => {
  const search = useSearchParams();
  const type = search?.get?.('type') ?? undefined;

  const isOffer = useMemo(() => type === 'offer', [type]);

  const offerId = isOffer ? orderId : null;

  const { offer, isLoading, error } = useP2POffer(offerId);
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();

  const [order, setOrder] = useState<P2POrder | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  if (!isOffer) return null;

  return (
    <div className="rounded-md bg-white p-4 shadow-sm dark:bg-zinc-900">
      {isLoading && <div>Loading offer...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {offer && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">Offer {offer.offerId}</h2>
          <dl>
            <div className="mb-2">
              <dt className="text-muted text-sm">Seller</dt>
              <dd className="font-mono text-sm">{offer.sellerWalletAddress}</dd>
            </div>

            <div className="mb-2">
              <dt className="text-muted text-sm">Total (MZD)</dt>
              <dd className="font-medium">{offer.totalMZD}</dd>
            </div>

            <div className="mb-2">
              <dt className="text-muted text-sm">Available (MZD)</dt>
              <dd className="font-medium">{offer.available}</dd>
            </div>

            <div className="mb-2">
              <dt className="text-muted text-sm">Exchange Rate</dt>
              <dd className="font-medium">{offer.exchangeRate}</dd>
            </div>

            {offer.bankInfo && (
              <div className="mt-3 rounded-md border bg-zinc-50 p-2 dark:bg-zinc-800">
                <div className="text-muted text-sm">Bank Info</div>
                <div className="text-sm">
                  {offer.bankInfo.bank} • {offer.bankInfo.accountNumber}
                </div>
                <div className="text-muted text-sm">{offer.bankInfo.accountName}</div>
              </div>
            )}
            {/* Buy form */}
            {!order && (
              <BuyAmountSection offer={offer} onConfirmBuy={async (amountMZD, amountVND) => {
                setCreateError(null);
                try {
                  const o = await createOrder(offer, amountMZD, amountVND);
                  if (o) setOrder(o);
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Failed to create order';
                  setCreateError(msg);
                  console.error('Create order error:', err);
                }
              }} isLoading={isCreatingOrder} />
            )}

            {createError && <div className="mt-2 text-sm text-red-500">{createError}</div>}

            {/* Show order details after creation */}
            {order && (
              <div className="mt-6 space-y-4">
                <OrderInfoCard order={order} />
                <BankInfoCard bankInfo={offer.bankInfo} transferCode={offer.transferCode} />
                <PaymentActionButton order={order} onPaymentConfirmed={() => {
                  // naive local state update — real implementation should update from backend
                  setOrder({ ...order, status: 'WAIT_CONFIRM' });
                }} />
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
};
