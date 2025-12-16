'use client';

import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { P2POffer } from '../../types';
import { Bolt } from 'lucide-react';

interface BankInfoCardProps {
  bank_info?: P2POffer['bank_info'];
  transfer_code?: P2POffer['transfer_code'];
}

export const BankInfoCard = ({ bank_info, transfer_code }: BankInfoCardProps) => {
  if (!bank_info) {
    return null;
  }

  return (
    <Card className="bg-card mb-8 rounded-xl border border-gray-800 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-white">Bank transfer details</h3>
        <span className="flex items-center gap-1 rounded bg-yellow-500/20 px-2 py-1 text-xs font-bold text-yellow-500">
          <Bolt className="h-3 w-3" />
          Instant transfer 24/7
        </span>
      </div>

      <div className="space-y-4">
        <div className="group flex items-center justify-between rounded p-2 transition hover:bg-gray-800/50">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Account number</div>
            <div className="font-mono text-lg font-bold tracking-wider text-white">{bank_info.account_number}</div>
          </div>
          <CopyButton textToCopy={bank_info.account_number} className="p-2 text-gray-400 transition hover:text-white" />
        </div>

        <div className="group flex items-center justify-between rounded p-2 transition hover:bg-gray-800/50">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Bank</div>
            <div className="text-base font-bold text-white">{bank_info.bank}</div>
          </div>
          <CopyButton textToCopy={bank_info.bank} className="p-2 text-gray-400 transition hover:text-white" />
        </div>

        {transfer_code && (
          <div className="group flex items-center justify-between rounded border border-yellow-500/20 bg-yellow-500/5 p-3">
            <div>
              <div className="mb-1 text-xs font-bold text-yellow-600 uppercase dark:text-yellow-500">
                Transfer note (required)
              </div>
              <div className="font-mono text-xl font-bold tracking-widest text-yellow-500">{transfer_code}</div>
            </div>
            <CopyButton textToCopy={transfer_code} className="p-2 text-yellow-500 transition hover:text-yellow-300" />
          </div>
        )}
      </div>
    </Card>
  );
};
