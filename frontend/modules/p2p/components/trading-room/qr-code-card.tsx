'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TriangleAlert } from 'lucide-react';
import { BANK_OPTIONS } from '../../constants';

interface QrCodeCardProps {
  bank_info?: string;
  transfer_code?: string | null;
  amount?: number;
}

export const QrCodeCard = ({ bank_info, transfer_code, amount }: QrCodeCardProps) => {
  const payment_info = useMemo(() => {
    if (!bank_info) {
      return null;
    }
    try {
      const parsed = JSON.parse(bank_info);
      return parsed;
    } catch (error) {
      console.error('QrCodeCard: Failed to parse bank_info:', error, 'Raw value:', bank_info);
      return null;
    }
  }, [bank_info]);

  const qrCodeUrl = useMemo(() => {
    if (!payment_info) {
      return '';
    }

    const { bank_name, account_number, account_name } = payment_info;

    if (!bank_name || !account_number) {
      return '';
    }

    const bank = BANK_OPTIONS.find((option) => option.label === bank_name || option.value === bank_name);
    const bankCode = bank?.value || bank_name;

    let url = `https://img.vietqr.io/image/${bankCode}-${account_number}-print.png`;

    const params: string[] = [];
    if (amount) params.push(`amount=${amount}`);
    if (transfer_code) params.push(`addInfo=${encodeURIComponent(transfer_code)}`);
    if (account_name) params.push(`accountName=${encodeURIComponent(account_name)}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return url;
  }, [payment_info, transfer_code, amount]);

  const handleDownload = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vietqr-${payment_info?.account_number || 'payment'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  if (!payment_info) {
    return null;
  }

  return (
    <Card className="border-border mb-4 h-full rounded-lg border p-2 shadow-lg">
      <div className="flex flex-1 flex-col items-center justify-center space-y-6">
        {qrCodeUrl ? (
          <>
            <div className="animate-pulse px-4 text-center">
              <p className="text-[13px] leading-tight font-medium text-amber-500">
                <span className="mb-1 flex items-center justify-center gap-1">
                  <TriangleAlert className="h-4 w-4" /> Recommendation:
                </span>
                To avoid delays, please message the seller to confirm they are online before making the payment.
              </p>
            </div>
            <div className="flex aspect-square w-full max-w-[90%] items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="VietQR Payment Code"
                className="h-full w-[90%] rounded-lg bg-white object-contain"
                loading="lazy"
              />
            </div>
            <Button
              className="bg-primary hover:bg-primary/80 text-white"
              onClick={handleDownload}
              variant="outline"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </>
        ) : (
          <div className="border-border bg-muted/50 flex aspect-square w-full max-w-[400px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground text-center text-sm">QR code unavailable</p>
          </div>
        )}
      </div>
    </Card>
  );
};
