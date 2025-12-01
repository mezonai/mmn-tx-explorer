'use client';

import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { P2POrder } from '../../types/p2p.types';
import { Bolt } from 'lucide-react';

interface BankInfoCardProps {
  order: P2POrder;
}

const bankLabels: Record<string, string> = {
  MB: 'MB Bank',
  VCB: 'Vietcombank',
  TCB: 'Techcombank',
  ACB: 'ACB',
  TPBANK: 'TPBank',
  VIETCOMBANK: 'Vietcombank',
};

export const BankInfoCard = ({ order }: BankInfoCardProps) => {
  const bankLabel = bankLabels[order.bankInfo.bank] || order.bankInfo.bank;

  return (
    <Card className="bg-card rounded-xl p-6 mb-8 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white">Thông tin chuyển khoản</h3>
        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded font-bold flex items-center gap-1">
          <Bolt className="h-3 w-3" />
          Chuyển tiền nhanh 24/7
        </span>
      </div>

      <div className="space-y-4">
        {/* Số tài khoản */}
        <div className="flex justify-between items-center group p-2 hover:bg-gray-800/50 rounded transition">
          <div>
            <div className="text-xs text-gray-500 uppercase font-medium">Số tài khoản</div>
            <div className="text-lg font-mono text-white font-bold tracking-wider">
              {order.bankInfo.accountNumber}
            </div>
          </div>
          <CopyButton textToCopy={order.bankInfo.accountNumber} className="text-gray-400 hover:text-white p-2 transition" />
        </div>

        {/* Ngân hàng */}
        <div className="flex justify-between items-center group p-2 hover:bg-gray-800/50 rounded transition">
          <div>
            <div className="text-xs text-gray-500 uppercase font-medium">Ngân hàng</div>
            <div className="text-base text-white font-bold">{bankLabel}</div>
          </div>
          <CopyButton textToCopy={bankLabel} className="text-gray-400 hover:text-white p-2 transition" />
        </div>

        {/* Nội dung chuyển khoản */}
        <div className="flex justify-between items-center group bg-yellow-500/5 p-3 rounded border border-yellow-500/20">
          <div>
            <div className="text-xs text-yellow-600 dark:text-yellow-500 uppercase font-bold mb-1">
              Nội dung chuyển khoản (Bắt buộc)
            </div>
            <div className="text-xl font-mono text-yellow-500 font-bold tracking-widest">
              {order.transferCode}
            </div>
          </div>
          <CopyButton textToCopy={order.transferCode} className="text-yellow-500 hover:text-yellow-300 p-2 transition" />
        </div>
      </div>
    </Card>
  );
};

