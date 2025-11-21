'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateRedEnvelopeContext } from '@/modules/lucky-money/context/CreateRedEnvelopeContext';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { useState, useEffect } from 'react';

export function QrPreview() {
  const { generatedEnvelope } = useCreateRedEnvelopeContext();
  const [qrSize, setQrSize] = useState(176);
  const pathName = process.env.NEXT_BASE_FE || window.location.origin;

  useEffect(() => {
    const updateQrSize = () => {
      if (window.innerWidth < 640) {
        setQrSize(120);
      } else if (window.innerWidth < 768) {
        setQrSize(140);
      } else {
        setQrSize(176);
      }
    };
    updateQrSize();
    window.addEventListener('resize', updateQrSize);
    return () => window.removeEventListener('resize', updateQrSize);
  }, []);

  const qrCodeValue = JSON.stringify({ type: 'lucky-money', wallet_address: generatedEnvelope?.red_envelope_wallet || '' });
  const claimLink = generatedEnvelope
    ? `${pathName}/lucky-money/${generatedEnvelope.id}/claim`
    : '';

  const handleCopyLink = () => {
    if (generatedEnvelope && claimLink) {
      navigator.clipboard
        .writeText(claimLink)
        .then(() => {
          toast.success('Claim link copied!');
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
          toast.error('Failed to copy link.');
        });
    }
  };


  return (
    <Card className="border-brand-primary/30 dark:border-[rgb(255_59_99_/_0.4)] bg-brand-primary/5 dark:bg-[rgb(255_59_99_/_0.1)] text-brand-primary dark:text-[rgb(246_199_68)]">
      <CardHeader>
        <CardTitle className="text-sm sm:text-base md:text-lg text-brand-primary dark:text-[rgb(246_199_68)]">QR preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center px-2 sm:px-4">
          <div
            className={`flex h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 items-center justify-center rounded-lg border p-2 sm:p-3 md:p-4 text-xs ${
              generatedEnvelope && claimLink
                ? 'border-none bg-white dark:bg-white' 
                : 'border-yellow-500/30 dark:border-yellow-500/30 bg-gray-100 dark:bg-black/30 text-yellow-600 dark:text-yellow-500/60' 
            }`}
          >
            {generatedEnvelope && claimLink ? (
              <QRCode value={qrCodeValue} size={qrSize} />
            ) : (
              <span className="text-yellow-600 dark:text-yellow-500/60 text-xs">QR Placeholder</span>
            )}
          </div>
        </div>
        <p className="mt-4 sm:mt-5 text-xs text-muted-foreground dark:text-yellow-300/80 leading-relaxed">
          Share this QR offline or generate a link for digital distribution. Each
          scan requests a signed claim token before releasing đồng.
        </p>
        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          <Button
            variant="outline"
            className="w-full border-yellow-400/40 dark:border-yellow-400/40 text-brand-primary dark:text-[rgb(246_199_68)] hover:bg-yellow-400/10 dark:hover:bg-yellow-400/10 hover:text-brand-primary dark:hover:text-[rgb(246_199_68)] text-xs sm:text-sm py-1.5 sm:py-2"
            onClick={handleCopyLink}
            disabled={!generatedEnvelope}
          >
            Copy claim link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


