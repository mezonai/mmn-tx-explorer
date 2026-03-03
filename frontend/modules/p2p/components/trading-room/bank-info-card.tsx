'use client';

import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { P2POffer } from '../../types';
import { Bolt } from 'lucide-react';

interface BankInfoCardProps {
  bank_info?: P2POffer['bank_info'];
  transfer_code?: string | null;
}

export const BankInfoCard = ({ bank_info, transfer_code }: BankInfoCardProps) => {
  if (!bank_info) {
    return null;
  }

  return (
    <Card className="bg-card border-border rounded-lg border">
      <div className="mb-3 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-foreground text-xs font-bold">Bank transfer details</h3>
          <span className="flex items-center gap-1 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
            <Bolt className="h-2.5 w-2.5" />
            24/7
          </span>
        </div>

        <div className="space-y-2">
          {/* Bank & Account Number */}
          <div className="grid grid-cols-2 gap-2">
            <div className="group bg-muted/30 hover:bg-muted/50 border-border/50 flex items-center justify-between rounded border p-2 transition">
              <div className="min-w-0 flex-1">
                <div className="text-muted-foreground text-[9px] font-bold uppercase">Bank</div>
                <div className="text-foreground truncate text-xs font-bold">{bank_info.bank}</div>
              </div>
              <CopyButton
                textToCopy={bank_info.bank}
                className="text-muted-foreground hover:text-foreground ml-1 h-6 w-6 flex-shrink-0 transition"
              />
            </div>

            <div className="group bg-muted/30 hover:bg-muted/50 border-border/50 flex items-center justify-between rounded border p-2 transition">
              <div className="min-w-0 flex-1">
                <div className="text-muted-foreground text-[9px] font-bold uppercase">Account number</div>
                <div className="text-foreground truncate font-mono text-xs font-bold">{bank_info.account_number}</div>
              </div>
              <CopyButton
                textToCopy={bank_info.account_number}
                className="text-muted-foreground hover:text-foreground ml-1 h-6 w-6 flex-shrink-0 transition"
              />
            </div>
          </div>

          {/* Account Name */}
          <div className="group bg-muted/30 hover:bg-muted/50 border-border/50 flex items-center justify-between rounded border p-2 transition">
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground text-[9px] font-bold uppercase">Account name</div>
              <div className="text-foreground truncate text-xs font-bold uppercase">{bank_info.account_name}</div>
            </div>
            <CopyButton
              textToCopy={bank_info.account_name}
              className="text-muted-foreground hover:text-foreground ml-1 h-6 w-6 flex-shrink-0 transition"
            />
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
              <CopyButton
                textToCopy={transfer_code}
                className="ml-1 h-6 w-6 flex-shrink-0 text-yellow-500 transition hover:text-yellow-400"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
