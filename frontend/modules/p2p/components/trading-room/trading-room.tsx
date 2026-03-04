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
import { P2POrder, OrderStatus, AutoMessagePayload, TradeTypes } from '../../types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { AddressDisplay } from '@/components/shared/address-display';
import { ROUTES } from '@/configs/routes.config';
import { ChatSidebar } from './chat-sidebar';
import { STORAGE_KEYS } from '@/constant';
import { NumberUtil } from '@/utils';
import { mmnClient } from '@/modules/auth';
import { useTransfer } from '@/modules/transfer/hooks/useTransfer';
import { ETransferType } from '@/modules/transaction';
import { EMBED_MESSAGE_THEME, P2P_TRADING_ROLE, ORDER_EXPIRATION_DURATION_MS } from '../../constants';
import BigNumber from 'bignumber.js';
import { createTrackOrderComponents } from '../../util';

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
  const [userBalance, setUserBalance] = useState<number>(0);
  const { transfer } = useTransfer();
  const sideParam = searchParams.get('side') as TradeTypes | null;

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

  useEffect(() => {
    let mounted = true;
    const fetchBalance = async () => {
      if (!user?.id) return;
      try {
        const account = await mmnClient.getAccountByUserId(user.id);
        if (mounted && account?.balance) {
          setUserBalance(Number(account.balance));
        }
      } catch (error) {
        console.error('Fetch balance error:', error);
      }
    };
    fetchBalance();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const userRole = useMemo(() => {
    if (isOfferMode) {
      // In offer mode, sideParam or offer.side tells us what the RESPONDER is
      const side = sideParam || offer?.side;
      if (side === TradeTypes.BUY) return P2P_TRADING_ROLE.SELLER;
      return P2P_TRADING_ROLE.BUYER;
    }

    if (!user?.walletAddress || !order) return null;

    const offerSide = order.offer_type || offer?.side;
    const isOrderCreator = order.order_creator_wallet_address === user.walletAddress;
    const isOfferCreator = offer?.offer_creator_wallet_address === user.walletAddress;

    if (offerSide === TradeTypes.BUY) {
      // BUY Offer: Creator is BUYER, Responser (Order Creator) is SELLER
      if (isOfferCreator) return P2P_TRADING_ROLE.BUYER;
      if (isOrderCreator) return P2P_TRADING_ROLE.SELLER;
    } else {
      // SELL Offer: Creator is SELLER, Responser (Order Creator) is BUYER
      if (isOfferCreator) return P2P_TRADING_ROLE.SELLER;
      if (isOrderCreator) return P2P_TRADING_ROLE.BUYER;
    }

    return isOrderCreator ? P2P_TRADING_ROLE.BUYER : P2P_TRADING_ROLE.SELLER;
  }, [user?.walletAddress, order, isOfferMode, offer, sideParam]);

  useEffect(() => {
    if (order?.status) {
      setLocalStatus(null);
    }
  }, [order?.status]);

  const effectiveOrder: P2POrder = localStatus ? { ...order!, status: localStatus } : order!;

  const buyerButtonText = useMemo(() => {
    if (effectiveOrder?.offer_type === TradeTypes.BUY) {
      return 'Confirm purchase and payment received. Notify the seller';
    }
    return 'I have transferred, notify the seller';
  }, [effectiveOrder?.offer_type]);

  const sellerButtonText = useMemo(() => {
    if (effectiveOrder?.offer_type === TradeTypes.BUY) {
      return 'I confirm that I have received VND and released MZD';
    }
    return `Confirm money received, release ${APP_CONFIG.CHAIN_SYMBOL}`;
  }, [effectiveOrder?.offer_type]);

  const createOrderEmbed = (currentOrder: P2POrder, customTitle?: string, customColor?: string) => {
    const priceRate = offer?.price_rate || 1;
    const displayAmount = NumberUtil.scaleDownBigNumber(new BigNumber(currentOrder.amount));
    const mzdAmount = displayAmount.toFormat();
    const vndAmount = displayAmount.multipliedBy(priceRate).toFormat();

    const fullUrl = process.env.NEXT_PUBLIC_CHAT_APP_ZK_API_URL || window.location.origin;
    const domain = new URL(fullUrl).origin;
    const orderLink = `${domain}${ROUTES.P2P_TRADING_ROOM(currentOrder.order_id)}`;

    return {
      color: customColor || EMBED_MESSAGE_THEME.INDIGO,
      title: customTitle || `Order #${currentOrder.order_id}`,
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
          value: `${NumberUtil.formatWithCommas(priceRate)} VND/${APP_CONFIG.CHAIN_SYMBOL}`,
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
        components: createTrackOrderComponents(embedElement.url),
        buzz: true,
      });
    }
  }, [order, userRole]);

  const handlePaymentStatusUpdated = (updatedOrder: P2POrder) => {
    setLocalStatus(updatedOrder.status);

    const embedElement = createOrderEmbed(updatedOrder, `Payment Sent - Order #${updatedOrder.order_id}`);

    setAutoMessage({
      text: `I have transferred the payment. Please check your bank account and release ${APP_CONFIG.CHAIN_SYMBOL}.`,
      embed: [embedElement],
      components: createTrackOrderComponents(embedElement.url),
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
        components: createTrackOrderComponents(embedElement.url),
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

  const handleConfirmBuy = async (
    amountMZD: number,
    amountVND: number,
    bankInfo?: { bank: string; account_number: string; account_name: string }
  ) => {
    if (!offer || !user?.walletAddress) {
      setError('Please sign in to continue.');
      return;
    }

    try {
      setError(null);
      const newOrder = await createOrder(offer, amountMZD, amountVND, bankInfo as any);

      if (newOrder) {
        // If it's a BUY offer, the responder (Seller) needs to transfer Mezon to escrow
        if (offer.side === TradeTypes.BUY) {
          const transferResult = await transfer(
            {
              recipientAddress: offer.intermediary_wallet_address || '',
              amount: amountMZD.toString(),
              note: 'p2p-trading',
              offerId: offer.offer_id,
            },
            ETransferType.P2PTrading
          );

          if (!transferResult.success) {
            toast.error(JSON.parse(transferResult.error || '').message || 'Transfer to escrow failed.');
            return;
          }
        }

        sessionStorage.setItem(STORAGE_KEYS.P2P_PENDING_GREETING(newOrder.order_id), 'true');
        router.push(ROUTES.P2P_TRADING_ROOM(newOrder.order_id));
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || 'Something went wrong while creating the order. Please try again.';
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
      order_creator_wallet_address: user?.walletAddress || '',
      offer_creator_wallet_address: offer?.offer_creator_wallet_address || '',
      amount: '0',
      price: 0,
      payable_amount: '0',
      status: OrderStatus.OPEN,
      transfer_code: null,
      expires_at: new Date(Date.now() + ORDER_EXPIRATION_DURATION_MS).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bank_info: offer.bank_info,
      price_rate: offer.price_rate,
      order_creator_user_id: '',
      offer_creator_user_id: '',
      side: offer.side,
    };

    const isSellerOfOffer = user?.walletAddress === offer?.offer_creator_wallet_address;

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
                {offer?.side === TradeTypes.BUY ? 'Sell' : 'Buy'} {APP_CONFIG.CHAIN_SYMBOL}{' '}
                {offer?.side === TradeTypes.BUY ? 'to' : 'from'}{' '}
                <AddressDisplay
                  addressClassName="text-brand-primary"
                  address={offer?.offer_creator_wallet_address}
                  href={ROUTES.WALLET(offer?.offer_creator_wallet_address)}
                />
              </h1>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                Trading with{' '}
                <AddressDisplay
                  addressClassName="text-brand-primary"
                  address={offer?.offer_creator_wallet_address}
                  href={ROUTES.WALLET(offer?.offer_creator_wallet_address)}
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
              side={sideParam || (offer.side as any)}
              userBalance={userBalance}
            />
          </div>

          <ChatSidebar sellerId={offer?.offer_creator_user_id || ''} />
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
            <p className="text-muted-foreground mb-4 text-sm font-medium italic">
              {effectiveOrder.offer_type === TradeTypes.BUY
                ? `Waiting for Seller to confirm payment and release  ${APP_CONFIG.CHAIN_SYMBOL}`
                : 'Waiting for the seller to confirm'}
            </p>
          )}

          {userRole === P2P_TRADING_ROLE.SELLER && effectiveOrder.status === OrderStatus.OPEN && (
            <p className="text-muted-foreground mb-4 text-sm font-medium italic">
              {effectiveOrder.offer_type === TradeTypes.BUY
                ? 'Waiting for Buyer to confirm payment.'
                : "Waiting for Buyer's confirmation of payment."}
            </p>
          )}

          {(effectiveOrder.status === OrderStatus.COMPLETED || effectiveOrder.status === OrderStatus.CONFIRMED) && (
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
              <p className="text-lg font-bold text-green-400">✓ Transaction completed successfully</p>
            </div>
          )}

          <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="flex flex-col gap-3 lg:col-span-8">
              <OrderInfoCard order={effectiveOrder} userRole={userRole} />
              {order && order.bank_info && order.transfer_code && (
                <BankInfoCard bank_info={order.bank_info} transfer_code={order.transfer_code} />
              )}
            </div>

            <div className="lg:col-span-4">
              {order && (order.bank_info || offer?.bank_info) && (
                <QrCodeCard
                  bank_info={order.bank_info || offer?.bank_info}
                  transfer_code={order.transfer_code}
                  amount={Number(order.payable_amount) || order.price}
                />
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {userRole === P2P_TRADING_ROLE.BUYER && (
              <PaymentActionButton
                order={effectiveOrder}
                nextStatus={OrderStatus.PENDING}
                onStatusUpdated={handlePaymentStatusUpdated}
                buttonText={buyerButtonText}
                disabled={isExpired}
              />
            )}
            {userRole === P2P_TRADING_ROLE.SELLER && (
              <SellerConfirmButton
                order={effectiveOrder}
                onConfirm={handleSellerConfirm}
                buttonText={sellerButtonText}
                disabled={isExpired}
              />
            )}
          </div>
        </div>
        <ChatSidebar
          sellerId={
            ((order.offer_type || offer?.side) === TradeTypes.BUY
              ? userRole === P2P_TRADING_ROLE.BUYER
                ? order.order_creator_user_id
                : offer?.offer_creator_user_id
              : userRole === P2P_TRADING_ROLE.BUYER
                ? offer?.offer_creator_user_id
                : order.order_creator_user_id) || ''
          }
          autoMessage={autoMessage}
          onAutoMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
};
