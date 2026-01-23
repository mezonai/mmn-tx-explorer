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
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { AddressDisplay } from '@/components/shared/address-display';
import { ROUTES } from '@/configs/routes.config';
import { ChatSidebar } from './chat-sidebar';
import { STORAGE_KEYS } from '@/constant';

interface TradingRoomProps {
  orderId: string;
}

export const TradingRoom = ({ orderId }: TradingRoomProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOfferMode = searchParams.get('type') === 'offer';

  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const { order, isLoading: orderLoading, updateOrderStatus } = useP2POrder(isOfferMode ? '' : orderId);
  const offerIdParam = isOfferMode ? orderId : order ? String(order.offer_id) : null;
  const { offer, isLoading: offerLoading } = useP2POffer(offerIdParam);
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();

  const [pendingOrderGreeting, setPendingOrderGreeting] = useState<P2POrder | null>(null);

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
    if (!order || userRole !== 'buyer') return;

    const shouldSendGreeting = sessionStorage.getItem(STORAGE_KEYS.P2P_PENDING_GREETING(order.order_id));

    if (shouldSendGreeting === 'true') {
      setPendingOrderGreeting(order);
    }
  }, [order, userRole]);

  useEffect(() => {
    if (order?.status) {
      setLocalStatus(null);
    }
  }, [order?.status]);

  const handleAutoMessageSent = () => {
    if (order) {
      sessionStorage.removeItem(STORAGE_KEYS.P2P_PENDING_GREETING(order.order_id));
      setPendingOrderGreeting(null);
    }
  };

  const handleConfirmBuy = async (amountMZD: number, amountVND: number) => {
    if (!offer || !user?.walletAddress) {
      setError('Please sign in to continue.');
      return;
    }

    try {
      setError(null);
      const newOrder = await createOrder(offer, amountMZD, amountVND);

      if (newOrder) {
        sessionStorage.setItem(STORAGE_KEYS.P2P_PENDING_GREETING(newOrder.order_id), 'true');
        router.push(ROUTES.P2P_TRADING_ROOM(newOrder.order_id));
      }
    } catch {
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
      throw err;
    }
  };

  if ((isOfferMode && offerLoading) || (!isOfferMode && (orderLoading || !order))) {
    return (
      <div className="relative flex flex-col">
        <div className="bg-card border-border h-14 border-b" />
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
      seller_wallet_address: offer?.seller_wallet_address || '',
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
      buyer_user_id: '',
      seller_user_id: '',
    };

    const isSellerOfOffer = user?.walletAddress === offer?.seller_wallet_address;

    return (
      <div className="bg-background relative flex flex-col">
        <div className="border-border flex h-14 shrink-0 items-center justify-between border-b px-6">
          <div className="flex items-center">
            <Button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Go back"
              variant="ghost"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-muted-foreground flex items-center gap-1 text-sm font-bold">
                Buy {APP_CONFIG.CHAIN_SYMBOL} from{' '}
                <AddressDisplay
                  addressClassName="text-brand-primary"
                  address={offer?.seller_wallet_address}
                  href={ROUTES.WALLET(offer?.seller_wallet_address)}
                />
              </h1>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                Trading with{' '}
                <AddressDisplay
                  addressClassName="text-brand-primary"
                  address={offer?.seller_wallet_address}
                  href={ROUTES.WALLET(offer?.seller_wallet_address)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 md:flex-row">
          <div className="border-border w-full p-6 md:w-7/12 lg:w-8/12">
            <ProgressSteps order={displayOrder} />
            {offer.has_active_order && (
              <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-600 dark:text-yellow-500">
                <p className="flex items-center gap-2 font-bold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                  Offer Temporarily Locked
                </p>
                <span className="mt-1 text-sm">
                  This offer is locked because a transaction is in progress. Please try again after it&apos;s completed.
                </span>
              </div>
            )}

            {error && (
              <div className="border-destructive/20 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
                {error}
              </div>
            )}

            <BuyAmountSection
              offer={offer}
              onConfirmBuy={handleConfirmBuy}
              isLoading={isCreatingOrder}
              extraDisabled={offer.has_active_order || isSellerOfOffer}
              isSeller={isSellerOfOffer}
            />
          </div>

          <ChatSidebar sellerId={offer.seller_user_id} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="relative flex flex-col">
        <div className="bg-card border-border h-14 border-b" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-foreground mb-2 text-xl font-bold">Order not found</h2>
            <p className="text-muted-foreground">This order does not exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const effectiveOrder: P2POrder = localStatus ? { ...order, status: localStatus } : order;

  return (
    <div className="bg-background relative flex flex-col">
      <TradingRoomHeader order={effectiveOrder} userRole={userRole} />
      <div className="flex flex-1 flex-col gap-6 md:flex-row">
        <div className="border-border w-full p-4 md:w-8/12 lg:w-10/12">
          <ProgressSteps order={effectiveOrder} />

          {userRole === 'buyer' && effectiveOrder.status === 'PENDING' && (
            <p className="text-muted-foreground mb-4 text-sm">Waiting for the seller to confirm</p>
          )}

          {(effectiveOrder.status === 'COMPLETED' || effectiveOrder.status === 'CONFIRMED') && (
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
              <p className="text-lg font-bold text-green-400">✓ Transaction completed successfully</p>
            </div>
          )}

          <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <OrderInfoCard order={effectiveOrder} />
              {order && order.bank_info && order.transfer_code && (
                <BankInfoCard
                  bank_info={order.bank_info}
                  transfer_code={order.transfer_code}
                  amount={order.payable_amount || order.price}
                />
              )}

              <div className="space-y-2">
                {userRole === 'buyer' && (
                  <PaymentActionButton
                    order={effectiveOrder}
                    nextStatus="PENDING"
                    onStatusUpdated={(updated) => setLocalStatus(updated.status)}
                    disabled={isExpired}
                  />
                )}
                {userRole === 'seller' && (
                  <SellerConfirmButton order={effectiveOrder} onConfirm={handleSellerConfirm} disabled={isExpired} />
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              {order && order.bank_info && (
                <QrCodeCard
                  bank_info={order.bank_info}
                  transfer_code={order.transfer_code}
                  amount={order.payable_amount || order.price}
                />
              )}
            </div>
          </div>
        </div>
        <ChatSidebar
          sellerId={userRole === 'buyer' ? order.seller_user_id : order.buyer_user_id}
          initialOrder={pendingOrderGreeting} // Pass the order object
          onInitialMessageSent={handleAutoMessageSent}
        />
      </div>
    </div>
  );
};
