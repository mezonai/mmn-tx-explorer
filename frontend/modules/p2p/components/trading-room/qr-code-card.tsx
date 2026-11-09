'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { Download, Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { UserPaymentInfo } from '../../types';
import { formatCurrency } from '../../util';
import { buildVietQrPayment } from '../../vietqr';
import { renderVietQrCardPng } from './vietqr-card-png';

const QR_VIEWBOX_SIZE = 256;

interface QrCodeCardProps {
  payment_info?: UserPaymentInfo;
  transfer_code?: string | null;
  amount?: number;
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const QrCodeCard = ({ payment_info, transfer_code, amount }: QrCodeCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const payment = useMemo(
    () =>
      payment_info ? buildVietQrPayment({ paymentInfo: payment_info, amount, transferCode: transfer_code }) : null,
    [payment_info, amount, transfer_code]
  );

  const handleDownload = async () => {
    if (!payment || isDownloading) return;

    setIsDownloading(true);
    try {
      const blob = await renderVietQrCardPng(payment);
      triggerDownload(blob, `vietqr-${payment.accountNumber}.png`);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error("Couldn't save the QR image. Try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!payment_info) {
    return null;
  }

  return (
    <Card className="bg-card border-border mb-4 h-full gap-0 overflow-hidden rounded-lg border p-0 shadow-lg">
      {payment && (
        <p
          role="note"
          className="flex items-start gap-2 bg-yellow-400 p-3 text-sm leading-snug font-medium text-red-800"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>Message the seller first and confirm they’re online.</span>
        </p>
      )}

      {/* Translucent in dark mode: solid brand-primary only gives white text 4.2:1 there, over the dark card it clears 4.5:1. */}
      <div className="bg-brand-primary dark:bg-brand-primary/40 p-3">
        <div className="flex items-start justify-between gap-2">
          {/* Wrap rather than truncate: the buyer compares this name with their bank app before confirming. */}
          <h3 className="min-w-0 text-sm leading-snug font-bold text-balance break-words text-white">
            {payment ? `Pay ${payment.accountName}` : 'Scan to pay'}
          </h3>
          <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white">
            mezon-dong
          </span>
        </div>
        {payment?.amount ? (
          <p className="mt-2 text-2xl leading-tight font-bold break-words text-white tabular-nums">
            {formatCurrency(payment.amount)} <span className="text-sm font-medium text-white/80">VND</span>
          </p>
        ) : null}
        {payment ? (
          <div className="mt-2 flex items-center gap-2">
            {/* Logos are transparent PNGs with dark artwork, so give them a white plate on the band. */}
            <div className="flex h-6 w-16 shrink-0 items-center justify-center rounded bg-white px-1">
              <Image src={payment.bank.logo} alt="" width={72} height={27} className="h-auto w-full object-contain" />
            </div>
            <span className="min-w-0 truncate text-xs text-white/80">{payment.bank.shortName}</span>
          </div>
        ) : null}
      </div>

      {payment ? (
        <div className="flex flex-col gap-3 p-3">
          {/* QR stays dark-on-white in both themes: banking apps don't reliably scan inverted codes. */}
          {/* Padding is a percentage so the quiet zone scales with the code; the wrapper makes it resolve against the plate's width, not the card's. */}
          <div className="mx-auto w-full max-w-86">
            <div className="rounded-lg bg-white p-[8%]">
              <QRCode
                value={payment.payload}
                level="M"
                size={QR_VIEWBOX_SIZE}
                viewBox={`0 0 ${QR_VIEWBOX_SIZE} ${QR_VIEWBOX_SIZE}`}
                title="VietQR payment code"
                className="mx-auto h-auto w-full max-w-[280px]"
              />
            </div>
          </div>

          <Button
            className="bg-brand-primary hover:bg-brand-primary/90 mx-auto w-full max-w-86 text-white motion-reduce:transition-none"
            onClick={handleDownload}
            disabled={isDownloading}
            aria-busy={isDownloading}
          >
            {isDownloading ? (
              <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />
            ) : (
              <Download aria-hidden />
            )}
            {isDownloading ? 'Saving…' : 'Save QR image'}
          </Button>
        </div>
      ) : (
        <div className="p-3">
          <div className="border-border bg-muted/50 flex aspect-square w-full items-center justify-center rounded-lg border border-dashed p-4">
            <p className="text-muted-foreground text-center text-sm">
              QR code unavailable for this bank account. Please transfer using the bank details.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
