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
import { P2POrder, OrderStatus, AutoMessagePayload } from '../../types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { AddressDisplay } from '@/components/shared/address-display';
import { ROUTES } from '@/configs/routes.config';
import { ChatSidebar } from './chat-sidebar';
import { STORAGE_KEYS } from '@/constant';
import { NumberUtil } from '@/utils';
import { EMBED_MESSAGE_THEME, P2P_TRADING_ROLE } from '../../constants';

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

  const [autoMessage, setAutoMessage] = useState<AutoMessagePayload | null>(null);

  const { order, isLoading: orderLoading, updateOrderStatus } = useP2POrder(isOfferMode ? '' : orderId);
  const offerIdParam = isOfferMode ? orderId : order ? String(order.offer_id) : null;
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
    if (isOfferMode) return P2P_TRADING_ROLE.BUYER;
    if (!user?.walletAddress || !order) return null;

    if (order.buyer_wallet_address === user.walletAddress) return P2P_TRADING_ROLE.BUYER;

    const sellerWallet = order.seller_wallet_address || offer?.seller_wallet_address;
    if (sellerWallet && sellerWallet === user.walletAddress) return P2P_TRADING_ROLE.SELLER;

    return P2P_TRADING_ROLE.SELLER;
  }, [user?.walletAddress, order, isOfferMode, offer]);

  useEffect(() => {
    if (order?.status) {
      setLocalStatus(null);
    }
  }, [order?.status]);

  const effectiveOrder: P2POrder = localStatus ? { ...order!, status: localStatus } : order!;

  const createOrderEmbed = (currentOrder: P2POrder, customTitle?: string, customColor?: string) => {
    const mzdAmount = NumberUtil.formatWithCommas(currentOrder.amount);
    const vndAmount = NumberUtil.formatWithCommas(currentOrder.amount * currentOrder.price_rate);

    const fullUrl = process.env.NEXT_PUBLIC_CHAT_APP_ZK_API_URL || window.location.origin;
    const domain = new URL(fullUrl).origin;
    const orderLink = `${domain}${ROUTES.P2P_TRADING_ROOM(currentOrder.order_id)}`;

    return {
      color: customColor || EMBED_MESSAGE_THEME.INDIGO,
      title: customTitle || `Click here to view Order #${currentOrder.order_id}`,
      url: orderLink,
      description: 'Transaction Details',
      fields: [
        {
          name: 'Buy Amount',
          value: `${mzdAmount} ${APP_CONFIG.CHAIN_SYMBOL}`,
          inline: true,
        },
        {
          name: 'Total Price',
          value: `${vndAmount} VND`,
          inline: true,
        },
        {
          name: 'Exchange Rate',
          value: `${NumberUtil.formatWithCommas(currentOrder.price_rate)} VND/${APP_CONFIG.CHAIN_SYMBOL}`,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'P2P Trading' },
    };
  };

  useEffect(() => {
    if (!order || userRole !== P2P_TRADING_ROLE.BUYER) return;

    const shouldSendGreeting = sessionStorage.getItem(STORAGE_KEYS.P2P_PENDING_GREETING(order.order_id));

    if (shouldSendGreeting === 'true') {
      const textContent = `Hello, I would like to buy your offer. Please check the order details below.`;

      const embedElement = createOrderEmbed(order);

      setAutoMessage({
        text: textContent,
        embed: [embedElement],
      });
    }
  }, [order, userRole]);

  const handlePaymentStatusUpdated = (updatedOrder: P2POrder) => {
    setLocalStatus(updatedOrder.status);

    const embedElement = createOrderEmbed(updatedOrder, `Payment Sent - Order #${updatedOrder.order_id}`);

    setAutoMessage({
      text: `I have transferred the payment. Please check your bank account and release ${APP_CONFIG.CHAIN_SYMBOL}.`,
      embed: [embedElement],
    });
  };

  const handleSellerConfirm = async () => {
    try {
      await updateOrderStatus(OrderStatus.CONFIRMED);
      setLocalStatus(OrderStatus.CONFIRMED);

      const embedElement = createOrderEmbed(
        effectiveOrder,
        `Order Completed - #${effectiveOrder.order_id}`,
        EMBED_MESSAGE_THEME.EMERAL
      );

      setAutoMessage({
        text: `Payment received. I have released. Thank you for trading!`,
        embed: [embedElement],
      });
    } catch (err: any) {
      console.error('Error updating order status:', err);
      if (err?.response?.data?.message) {
        toast.error(err?.response?.data?.message);
        setError('Order has expired');
      } else {
        setError('Something went wrong while updating status. Please try again.');
      }
      throw err;
    }
  };

  const handleMessageSent = () => {
    setAutoMessage(null);
    if (order && userRole === P2P_TRADING_ROLE.BUYER) {
      const key = STORAGE_KEYS.P2P_PENDING_GREETING(order.order_id);
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
      }
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
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Something went wrong while creating the order. Please try again.';
      setError(errorMessage);
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

  return (
    <div className="bg-background relative flex flex-col">
      <TradingRoomHeader order={effectiveOrder} userRole={userRole} />
      <div className="flex flex-1 flex-col gap-6 md:flex-row">
        <div className="border-border w-full p-4 md:w-8/12 lg:w-10/12">
          <ProgressSteps order={effectiveOrder} />

          {userRole === P2P_TRADING_ROLE.BUYER && effectiveOrder.status === OrderStatus.PENDING && (
            <p className="text-muted-foreground mb-4 text-sm">Waiting for the seller to confirm</p>
          )}

          {(effectiveOrder.status === OrderStatus.COMPLETED || effectiveOrder.status === OrderStatus.CONFIRMED) && (
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
                {userRole === P2P_TRADING_ROLE.BUYER && (
                  <PaymentActionButton
                    order={effectiveOrder}
                    nextStatus={OrderStatus.PENDING}
                    onStatusUpdated={handlePaymentStatusUpdated}
                    disabled={isExpired}
                  />
                )}
                {userRole === P2P_TRADING_ROLE.SELLER && (
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
          sellerId={userRole === P2P_TRADING_ROLE.BUYER ? order.seller_user_id : order.buyer_user_id}
          autoMessage={autoMessage}
          onAutoMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
};
