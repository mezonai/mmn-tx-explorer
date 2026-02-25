'use client';

import { Card } from '@/components/ui/card';
import { P2POrder, P2PTradingRoleType } from '../../types';
import { useP2POffer } from '../../hooks/useP2POffer';
import { APP_CONFIG } from '@/configs/app.config';
import { formatCurrency } from '@/modules/p2p/util';
import BigNumber from 'bignumber.js';
import { NumberUtil } from '@/utils';
import { P2P_TRADING_ROLE } from '../../constants';
import { useUser } from '@/providers/AppProvider';
import { TradeTypes } from '../../types';

interface OrderInfoCardProps {
  order: P2POrder;
  userRole?: P2PTradingRoleType | null;
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
  const { user } = useUser();
  const { offer } = useP2POffer(String(order.offer_id));
  const priceRate = offer?.price_rate || 0;
  const amount = NumberUtil.scaleDownBigNumber(new BigNumber(order.amount));
  const amountVND = priceRate > 0 ? amount.multipliedBy(priceRate) : new BigNumber(0);

  const isOrderCreator = user?.walletAddress === order.order_creator_wallet_address;
  const isActualBuyer = isOrderCreator ? order.side !== TradeTypes.BUY : order.side === TradeTypes.BUY;

  return (
    <Card className="bg-card border-border mb-3 rounded-lg border p-3 shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">{isActualBuyer ? 'Amount to pay' : 'Amount to receive'}</span>
          <span className="text-xl font-bold text-green-400">
            {amountVND.toFormat()} <span className="text-xs">VND</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Exchange rate</span>
          <span className="text-brand-primary text-sm font-semibold">
            1 {APP_CONFIG.CHAIN_SYMBOL} = {formatCurrency(priceRate)} VND
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">{isActualBuyer ? 'You will receive' : 'You will pay'}</span>
          <span className="brand-primary text-sm font-semibold">
            {amount.toFormat()} <span className="">{APP_CONFIG.CHAIN_SYMBOL}</span>
          </span>
        </div>
      </div>
    </Card>
  );
};
