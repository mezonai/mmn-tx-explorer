'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useP2POrder } from '../../hooks/useP2POrder';
import { useP2POffer } from '../../hooks/useP2POffer';
import { useCreateOrder } from '../../hooks/useCreateOrder';
import { useUser } from '@/providers/AppProvider';
import { TradingRoomHeader } from './trading-room-header';
import { ProgressSteps } from './progress-steps';
import { OrderInfoCard } from './order-info-card';
import { BankInfoCard } from './bank-info-card';
import { QrCodeCard } from './qr-code-card';
import { PaymentActionButton } from './payment-action-button';
import { SellerConfirmButton } from './seller-confirm-button';
import { BuyAmountSection } from './buy-amount-section';
import { Skeleton } from '@/components/ui/skeleton';
import { P2POrder, OrderStatus } from '../../types';
import { toast } from 'sonner';

interface TradingRoomProps {
  orderId: string;
  currentUserId?: string;
}

export const TradingRoom = ({ orderId, currentUserId }: TradingRoomProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOfferMode = searchParams.get('type') === 'offer';

  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const { order, isLoading: orderLoading, updateOrderStatus } = useP2POrder(isOfferMode ? '' : orderId);
  const offerIdParam = isOfferMode ? orderId : (order ? String(order.offer_id) : null);
  const { offer, isLoading: offerLoading } = useP2POffer(offerIdParam);
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();


  useEffect(() => {
    if (!order || isOfferMode) return;

    const checkExpiration = () => {
      const now = new Date().getTime();
      const expires = new Date(order.expires_at).getTime();
      const hasExpired = now >= expires;
      setIsExpired(hasExpired);
    };

    checkExpiration();

    const interval = setInterval(checkExpiration, 1000);

    return () => clearInterval(interval);
  }, [order, isOfferMode]);

  const userRole = useMemo(() => {
    if (isOfferMode) return 'buyer';
    if (!user?.walletAddress || !order) return null;

    if (order.buyer_wallet_address === user.walletAddress) return 'buyer';

    const sellerWallet = order.seller_wallet_address || offer?.seller_wallet_address;
    if (sellerWallet && sellerWallet === user.walletAddress) return 'seller';

    return 'seller';
  }, [user?.walletAddress, order, isOfferMode, offer]);

  useEffect(() => {
    if (order?.status) {
      setLocalStatus(null);
    }
  }, [order?.status]);

  const handleConfirmBuy = async (amountMZD: number, amountVND: number) => {
    if (!offer || !user?.walletAddress) {
      setError('Please sign in to continue.');
      return;
    }

    try {
      setError(null);
      const newOrder = await createOrder(offer, amountMZD, amountVND);

      if (newOrder) {

        router.push(`/p2p/trading-room/${newOrder.order_id}`);
      }
    } catch (err) {
      toast.error('Failed to create order', {
        description: 'Please try again later',
      });
      setError('Something went wrong while creating the order. Please try again.');
    }
  };


  const handleSellerConfirm = async () => {
    try {
      await updateOrderStatus('CONFIRMED');
      setLocalStatus(OrderStatus.CONFIRMED);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      if (err?.response?.data?.message === 'order has expired') {
        toast.error('Order has expired');
        setError('Order has expired');
      } else {
        setError('Something went wrong while updating status. Please try again.');
      }
    }
  };

  if ((isOfferMode && offerLoading) || (!isOfferMode && (orderLoading || !order))) {
    return (
      <div className="flex h-screen flex-col">
        <div className="bg-card h-14 border-b border-border" />
        <div className="flex-1 p-6">
          <Skeleton className="mb-6 h-20 w-full" />
          <Skeleton className="mb-6 h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }


  if (isOfferMode && offer) {
    const displayOrder: P2POrder = {
      order_id: '',
      offer_id: offer?.offer_id || '',
      buyer_wallet_address: user?.walletAddress || '',
      amount: 0,
      price: 0,
      payable_amount: 0,
      status: OrderStatus.OPEN,
      transfer_code: null,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bank_info: offer.bank_info,
      price_rate: offer.price_rate,
    };

    const formatWallet = (address?: string) =>
      (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A') as string;

    return (
      <div className="bg-background flex h-screen flex-col">
        <div className=" flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-muted-foreground transition hover:text-foreground"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-muted-foreground">
                Buy MZD from {formatWallet(offer?.seller_wallet_address)}
              </h1>
              <div className="text-xs text-muted-foreground">
                Trading with{' '}
                <span className="text-brand-primary font-bold">{formatWallet(offer?.seller_wallet_address)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          <div className="overflow-y-auto border-r border-border p-6 md:w-7/12 lg:w-8/12">
            <ProgressSteps order={displayOrder} />


            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <BuyAmountSection offer={offer} onConfirmBuy={handleConfirmBuy} isLoading={isCreatingOrder} />
          </div>


        </div>
      </div>
    );
  }


  if (!order) {
    return (
      <div className="flex h-screen flex-col">
        <div className="bg-card h-14 border-b border-border" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-bold text-foreground">Order not found</h2>
            <p className="text-muted-foreground">This order does not exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }


  const effectiveOrder: P2POrder = localStatus ? { ...order, status: localStatus } : order;

  return (
    <div className="bg-background flex h-screen flex-col">
      <TradingRoomHeader order={effectiveOrder} userRole={userRole} />

      <div className="flex flex-1 overflow-hidden">

        <div className="overflow-y-auto border-r border-border p-4 md:w-7/12 lg:w-8/12">
          <ProgressSteps order={effectiveOrder} />

          {userRole === 'buyer' && effectiveOrder.status === 'PENDING' && (
            <p className="mb-4 text-sm text-muted-foreground">Waiting for the seller to confirm</p>
          )}

          {(effectiveOrder.status === 'COMPLETED' || effectiveOrder.status === 'CONFIRMED') && (
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
              <p className="text-lg font-bold text-green-400">✓ Transaction completed successfully</p>
            </div>
          )}



          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 mb-4">
            <div className="lg:col-span-7 space-y-6">
              <OrderInfoCard order={effectiveOrder} />
              {order && order.bank_info && order.transfer_code && (
                <BankInfoCard
                  bank_info={order.bank_info}
                  transfer_code={order.transfer_code}
                  amount={order.payable_amount || order.price}
                />
              )}
            </div>

            <div className="lg:col-span-5">
              {order && order.bank_info && (
                <QrCodeCard
                  bank_info={order.bank_info}
                  transfer_code={order.transfer_code}
                  amount={order.payable_amount || order.price}
                />
              )}
            </div>
          </div>

          {userRole === 'buyer' && (
            <PaymentActionButton
              order={effectiveOrder}
              nextStatus="PENDING"
              onStatusUpdated={(updated) => setLocalStatus(updated.status)}
              disabled={isExpired}
            />
          )}
          {userRole === 'seller' && (
            <SellerConfirmButton
              order={effectiveOrder}
              onConfirm={handleSellerConfirm}
              disabled={isExpired}
            />
          )}
        </div>
      </div>
    </div>
  );
};
