'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { P2POffer } from '../../types';
import { Bolt, QrCode } from 'lucide-react';

interface BankInfoCardProps {
  bank_info?: P2POffer['bank_info'];
  transfer_code?: P2POffer['transfer_code'];
  amount?: number; // Amount in VND
}

export const BankInfoCard = ({ bank_info, transfer_code, amount }: BankInfoCardProps) => {
  // Generate VietQR URL
  const qrCodeUrl = useMemo(() => {
    if (!bank_info) return '';

    const { bank, account_number, account_name } = bank_info;

    // Base URL with bank code and account number
    let url = `https://img.vietqr.io/image/${bank}-${account_number}-print.png`;

    // Add query parameters
    const params: string[] = [];

    if (amount) params.push(`amount=${amount}`);
    if (transfer_code) params.push(`addInfo=${encodeURIComponent(transfer_code)}`);
    if (account_name) params.push(`accountName=${encodeURIComponent(account_name)}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return url;
  }, [bank_info, transfer_code, amount]);

  if (!bank_info) {
    return null;
  }

  return (
    <Card className="bg-card mb-8 rounded-xl border border-border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-foreground">Bank transfer details</h3>
        <span className="flex items-center gap-1 rounded bg-yellow-500/20 px-2 py-1 text-xs font-bold text-yellow-500">
          <Bolt className="h-3 w-3" />
          Instant transfer 24/7
        </span>
      </div>

      {/* 2-column layout: Bank info left, QR code right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column - Bank information */}
        <div className="space-y-4">
          <div className="group flex items-center justify-between rounded p-2 transition hover:bg-muted/50">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase">Account number</div>
              <div className="font-mono text-lg font-bold tracking-wider text-foreground">{bank_info.account_number}</div>
            </div>
            <CopyButton textToCopy={bank_info.account_number} className="p-2 text-muted-foreground transition hover:text-foreground" />
          </div>

          <div className="group flex items-center justify-between rounded p-2 transition hover:bg-muted/50">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase">Bank</div>
              <div className="text-base font-bold text-foreground">{bank_info.bank}</div>
            </div>
            <CopyButton textToCopy={bank_info.bank} className="p-2 text-muted-foreground transition hover:text-foreground" />
          </div>

          <div className="group flex items-center justify-between rounded p-2 transition hover:bg-muted/50">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase">Account name</div>
              <div className="text-base font-bold text-foreground">{bank_info.account_name}</div>
            </div>
            <CopyButton textToCopy={bank_info.account_name} className="p-2 text-muted-foreground transition hover:text-foreground" />
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

        {/* Right column - QR Code */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-4">
          {qrCodeUrl ? (
            <div className="relative">
              <img
                src={qrCodeUrl}
                alt="VietQR Payment Code"
                className="h-auto w-full max-w-[280px] rounded-lg border border-gray-700 bg-white p-2"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-[280px] w-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/50">
              <p className="text-center text-sm text-muted-foreground">QR code unavailable</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
