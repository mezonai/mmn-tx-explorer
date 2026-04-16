'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TriangleAlert } from 'lucide-react';
import { BANK_OPTIONS } from '../../constants';
import { UserPaymentInfo } from '../../types';

interface QrCodeCardProps {
  payment_info?: UserPaymentInfo;
  transfer_code?: string | null;
  amount?: number;
}

export const QrCodeCard = ({ payment_info, transfer_code, amount }: QrCodeCardProps) => {
  const paymentData = payment_info;

  const qrCodeUrl = useMemo(() => {
    if (!paymentData) {
      return '';
    }

    const bankName = paymentData.bank_name;
    const accountNumber = paymentData.account_number;
    const accountName = paymentData.account_name;

    if (!bankName || !accountNumber) {
      return '';
    }

    const bank = BANK_OPTIONS.find((option) => option.label === bankName || option.value === bankName);
    const bankCode = bank?.value || bankName;

    let url = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-print.png`;

    const params: string[] = [];
    if (amount) params.push(`amount=${amount}`);
    if (transfer_code) params.push(`addInfo=${encodeURIComponent(transfer_code)}`);
    if (accountName) params.push(`accountName=${encodeURIComponent(accountName)}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return url;
  }, [paymentData, transfer_code, amount]);

  const handleDownload = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const accountNumber = paymentData?.account_number || 'payment';
      link.download = `vietqr-${accountNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  if (!paymentData) {
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
