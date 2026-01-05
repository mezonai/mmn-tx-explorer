'use client';

import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { P2POffer } from '../../types';
import { Bolt } from 'lucide-react';

interface BankInfoCardProps {
  bank_info?: P2POffer['bank_info'];
  transfer_code?: string | null;
  amount?: number;
}

export const BankInfoCard = ({ bank_info, transfer_code, amount }: BankInfoCardProps) => {
  if (!bank_info) {
    return null;
  }

  return (
    <Card className="bg-card rounded-lg border border-border">
      <div className="p-3 mb-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold text-foreground">Bank transfer details</h3>
          <span className="flex items-center gap-1 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
            <Bolt className="h-2.5 w-2.5" />
            24/7
          </span>
        </div>

        <div className="space-y-2">
          {/* Bank & Account Number */}
          <div className="grid grid-cols-2 gap-2">
            <div className="group flex items-center justify-between rounded bg-muted/30 p-2 transition hover:bg-muted/50 border border-border/50">
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold text-muted-foreground uppercase">Bank</div>
                <div className="text-xs font-bold text-foreground truncate">{bank_info.bank}</div>
              </div>
              <CopyButton textToCopy={bank_info.bank} className="h-6 w-6 ml-1 flex-shrink-0 text-muted-foreground transition hover:text-foreground" />
            </div>

            <div className="group flex items-center justify-between rounded bg-muted/30 p-2 transition hover:bg-muted/50 border border-border/50">
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold text-muted-foreground uppercase">Account number</div>
                <div className="font-mono text-xs font-bold text-foreground truncate">{bank_info.account_number}</div>
              </div>
              <CopyButton textToCopy={bank_info.account_number} className="h-6 w-6 ml-1 flex-shrink-0 text-muted-foreground transition hover:text-foreground" />
            </div>
          </div>

          {/* Account Name */}
          <div className="group flex items-center justify-between rounded bg-muted/30 p-2 transition hover:bg-muted/50 border border-border/50">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-bold text-muted-foreground uppercase">Account name</div>
              <div className="text-xs font-bold text-foreground uppercase truncate">{bank_info.account_name}</div>
            </div>
            <CopyButton textToCopy={bank_info.account_name} className="h-6 w-6 ml-1 flex-shrink-0 text-muted-foreground transition hover:text-foreground" />
          </div>

          {/* Transfer Note */}
          {transfer_code && (
            <div className="group flex items-center justify-between rounded border border-yellow-500/30 bg-yellow-500/5 p-2 transition hover:bg-yellow-500/10">
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold text-yellow-600 uppercase dark:text-yellow-500">
                  Transfer note (required)
                </div>
                <div className="font-mono text-sm font-bold text-yellow-500">{transfer_code}</div>
              </div>
              <CopyButton textToCopy={transfer_code} className="h-6 w-6 ml-1 flex-shrink-0 text-yellow-500 transition hover:text-yellow-400" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};