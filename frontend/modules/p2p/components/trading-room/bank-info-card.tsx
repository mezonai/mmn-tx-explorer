'use client';

import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { P2POffer } from '../../types';
import { Bolt } from 'lucide-react';

interface BankInfoCardProps {
  bank_info?: P2POffer['bank_info'];
  transfer_code?: string | null;
  amount?: number; // Amount in VND
}

export const BankInfoCard = ({ bank_info, transfer_code, amount }: BankInfoCardProps) => {
  if (!bank_info) {
    return null;
  }

  return (
    <Card className="bg-card rounded-xl border border-border">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Bank transfer details</h3>
          <span className="flex items-center gap-1 rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-500">
            <Bolt className="h-3 w-3" />
            24/7
          </span>
        </div>

        <div className="space-y-3">
          {/* Bank & Account Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="group flex items-center justify-between rounded bg-muted/30 p-2 transition hover:bg-muted/50 border border-border/50">
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Bank</div>
                <div className="text-sm font-bold text-foreground">{bank_info.bank}</div>
              </div>
              <CopyButton textToCopy={bank_info.bank} className="h-7 w-7 text-muted-foreground transition hover:text-foreground" />
            </div>

            <div className="group flex items-center justify-between rounded bg-muted/30 p-2 transition hover:bg-muted/50 border border-border/50">
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Account number</div>
                <div className="font-mono text-sm font-bold text-foreground">{bank_info.account_number}</div>
              </div>
              <CopyButton textToCopy={bank_info.account_number} className="h-7 w-7 text-muted-foreground transition hover:text-foreground" />
            </div>
          </div>

          {/* Account Name */}
          <div className="group flex items-center justify-between rounded bg-muted/30 p-2 transition hover:bg-muted/50 border border-border/50">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">Account name</div>
              <div className="text-sm font-bold text-foreground uppercase">{bank_info.account_name}</div>
            </div>
            <CopyButton textToCopy={bank_info.account_name} className="h-7 w-7 text-muted-foreground transition hover:text-foreground" />
          </div>

          {/* Transfer Note */}
          {transfer_code && (
            <div className="group flex items-center justify-between rounded border border-yellow-500/30 bg-yellow-500/5 p-2 transition hover:bg-yellow-500/10">
              <div>
                <div className="text-[10px] font-bold text-yellow-600 uppercase dark:text-yellow-500">
                  Transfer note (required)
                </div>
                <div className="font-mono text-base font-bold text-yellow-500">{transfer_code}</div>
              </div>
              <CopyButton textToCopy={transfer_code} className="h-7 w-7 text-yellow-500 transition hover:text-yellow-400" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
