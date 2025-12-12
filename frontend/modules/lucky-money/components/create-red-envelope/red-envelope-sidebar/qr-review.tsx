'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateRedEnvelopeContext } from '@/modules/lucky-money/context/CreateRedEnvelopeContext';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { useState, useEffect } from 'react';

const RED_ENVELOPE_SVG_STRING = `
<svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="110" rx="10" fill="black" />
  <rect x="10" y="10" width="80" height="100" rx="8" fill="#DC2626" />
  <path d="M10 10 L50 45 L90 10" stroke="#991B1B" stroke-width="2" fill="none" />
  <path d="M10 10 L50 45 L90 10 Z" fill="#B91C1C" opacity="0.5" />
  <circle cx="50" cy="50" r="12" fill="#FBBF24" />
  <circle cx="50" cy="50" r="8" fill="#F59E0B" />
</svg>
`;
const iconSvgBase64 = `data:image/svg+xml;base64,${btoa(RED_ENVELOPE_SVG_STRING)}`;

export function QrPreview() {
  const { generatedEnvelope, isSuccess } = useCreateRedEnvelopeContext();
  const [qrSize, setQrSize] = useState(176);
  const pathName = process.env.NEXT_BASE_FE || window.location.origin;

  const CONFIG = {
    brandColor: '#d9534f',
    labelColor: '#6d28d9',
    bgColor: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
  };

  useEffect(() => {
    const updateQrSize = () => {
      if (window.innerWidth < 640) setQrSize(120);
      else if (window.innerWidth < 768) setQrSize(140);
      else setQrSize(176);
    };
    updateQrSize();
    window.addEventListener('resize', updateQrSize);
    return () => window.removeEventListener('resize', updateQrSize);
  }, []);

  const qrCodeValue = JSON.stringify({ type: 'lucky-money', lucky_money_id: generatedEnvelope?.id });
  const claimLink = generatedEnvelope ? `${pathName}/lucky-money/${generatedEnvelope.id}/claim` : '';
  const shouldShowQr = generatedEnvelope && claimLink && isSuccess;

  const getQrImage = (callback: (blob: Blob | null) => void) => {
    const svg = document.getElementById('lucky-money-qr');
    if (!svg) {
      callback(null);
      return;
    }

    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(xml);
    const qrImage64 = 'data:image/svg+xml;base64,' + svg64;

    const iconBlob = new Blob([RED_ENVELOPE_SVG_STRING], { type: 'image/svg+xml;charset=utf-8' });
    const iconUrl = URL.createObjectURL(iconBlob);

    const qrImg = new Image();
    const iconImg = new Image();

    const drawCanvas = () => {
      const canvas = document.createElement('canvas');
      const width = 600;
      const height = 750;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.fillStyle = CONFIG.bgColor;
      ctx.fillRect(0, 0, width, height);

      ctx.textAlign = 'center';

      ctx.fillStyle = CONFIG.labelColor;
      ctx.font = `600 24px ${CONFIG.fontFamily}`;
      ctx.fillText('Scan to receive', width / 2, 80);

      ctx.fillStyle = '#111827';
      ctx.font = `bold 40px ${CONFIG.fontFamily}`;
      ctx.fillText('MEZON LUCKY MONEY', width / 2, 140);

      const qrDrawSize = 400;
      const qrX = (width - qrDrawSize) / 2;
      const qrY = 180;

      ctx.drawImage(qrImg, qrX, qrY, qrDrawSize, qrDrawSize);

      const centerX = width / 2;
      const centerY = qrY + qrDrawSize / 2;

      const boxSize = qrDrawSize * 0.22;

      ctx.fillStyle = '#FFFFFF';
      const boxX = centerX - boxSize / 2;
      const boxY = centerY - boxSize / 2;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxSize, boxSize, 12);
        ctx.fill();
      } else {
        ctx.fillRect(boxX, boxY, boxSize, boxSize);
      }

      const padding = 5;
      const availableSize = boxSize - padding * 2;

      const drawHeight = availableSize;
      const drawWidth = drawHeight * (100 / 120);

      ctx.drawImage(iconImg, centerX - drawWidth / 2, centerY - drawHeight / 2, drawWidth, drawHeight);

      ctx.font = `18px ${CONFIG.fontFamily}`;
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText('Powered by Mezon', width / 2, height - 40);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(iconUrl);
        callback(blob);
      }, 'image/png');
    };

    let loadedCount = 0;
    const checkLoad = () => {
      loadedCount++;
      if (loadedCount >= 2) drawCanvas();
    };

    qrImg.onload = checkLoad;
    qrImg.src = qrImage64;

    iconImg.onload = checkLoad;
    iconImg.src = iconUrl;
  };

  const handleDownloadQr = () => {
    if (!generatedEnvelope) return;

    getQrImage((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lucky-money-${generatedEnvelope.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        toast.success('QR Code downloaded!');
      } else {
        toast.error('Failed to generate image');
      }
    });
  };

  const handleCopyLink = () => {
    if (generatedEnvelope && claimLink) {
      navigator.clipboard
        .writeText(claimLink)
        .then(() => toast.success('Claim link copied!'))
        .catch((err) => toast.error('Failed to copy link.'));
    }
  };

  return (
    <Card className="border-brand-primary/30 bg-brand-primary/5 text-brand-primary dark:border-[rgb(255_59_99_/_0.4)] dark:bg-[rgb(255_59_99_/_0.1)] dark:text-[rgb(246_199_68)]">
      <CardHeader>
        <CardTitle className="text-brand-primary text-sm sm:text-base md:text-lg dark:text-[rgb(246_199_68)]">
          QR preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center px-2 sm:px-4">
          <div
            className={`relative flex h-36 w-36 items-center justify-center rounded-lg border p-2 text-xs sm:h-44 sm:w-44 sm:p-3 md:h-52 md:w-52 md:p-4 ${
              shouldShowQr
                ? 'border-none bg-white dark:bg-white'
                : 'border-yellow-500/30 bg-gray-100 text-yellow-600 dark:border-yellow-500/30 dark:bg-black/30 dark:text-yellow-500/60'
            } `}
          >
            {shouldShowQr ? (
              <>
                <QRCode id="lucky-money-qr" value={qrCodeValue} size={qrSize} level="H" />
                <div
                  className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white"
                  style={{
                    width: qrSize * 0.3,
                    height: qrSize * 0.3,
                    padding: 2,
                  }}
                >
                  <img
                    src={iconSvgBase64}
                    alt="icon"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </>
            ) : (
              <span className="text-xs text-yellow-600 dark:text-yellow-500/60">QR Placeholder</span>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-xs leading-relaxed sm:mt-5 dark:text-yellow-300/80">
          Share this QR offline or generate a link for digital distribution.
        </p>
        <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
          <Button
            variant="outline"
            className="w-full border-yellow-400/40 py-1.5 text-xs hover:bg-yellow-400/10 sm:py-2 sm:text-sm dark:text-[rgb(246_199_68)]"
            onClick={handleCopyLink}
            disabled={!isSuccess}
          >
            Copy claim link
          </Button>
          <Button
            variant="outline"
            className="w-full border-yellow-400/40 py-1.5 text-xs hover:bg-yellow-400/10 sm:py-2 sm:text-sm dark:text-[rgb(246_199_68)]"
            onClick={handleDownloadQr}
            disabled={!isSuccess}
          >
            Download QR code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
