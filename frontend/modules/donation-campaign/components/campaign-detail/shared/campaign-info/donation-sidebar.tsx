'use client';

import { CopyButton } from '@/components/ui/copy-button';
import { DonationCampaign, ECampaignStatus } from '@/modules/donation-campaign/type';
import { useAuth } from '@/providers';
import { DonateDialog } from './donate-dialog';
import { truncateWalletAddress } from '@/modules/donation-campaign/utils';
import Link from 'next/link';
import { ROUTES } from '@/configs/routes.config';
import { APP_CONFIG } from '@/configs/app.config';
import { cn } from '@/lib/utils';
import { useHidden } from '../../provider';
import QRCode from 'react-qr-code';
import { useRef } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DonationSidebar({ campaign }: { campaign: DonationCampaign }) {
  const { isAuthenticated } = useAuth();
  const { hidden } = useHidden();
  const qrRef = useRef<HTMLDivElement>(null);

  const qrCodeValue = JSON.stringify({ type: 'transfer_wallet', wallet_address: campaign.donation_wallet });

  const CENTER_TEXT_LINES = ['Scan', 'Mezon'];
  const BRAND_COLOR = '#6941C6';
  const fontVar = getComputedStyle(document.body).getPropertyValue('--font-inter')?.trim();
  const interStack = fontVar ? `${fontVar}, Inter, sans-serif` : 'Inter, sans-serif';

  const getQrImage = (callback: (blob: Blob | null) => void) => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) {
      console.error('QR Code SVG not found');
      callback(null);
      return;
    }

    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(xml);
    const b64Start = 'data:image/svg+xml;base64,';
    const image64 = b64Start + svg64;

    const img = new Image();
    img.onerror = () => {
      console.error('Failed to load QR image');
      callback(null);
    };
    img.src = image64;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // --- 2. Header Strip ---
        ctx.fillStyle = BRAND_COLOR;
        ctx.fillRect(0, 0, width, 20);

        // --- 3. Campaign Header ---
        ctx.textAlign = 'center';

        ctx.fillStyle = BRAND_COLOR;
        ctx.font = `bold 24px ${interStack}`;
        ctx.fillText('SCAN TO DONATE', width / 2, 80);

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 48px sans-serif';
        const campaignName = campaign.name.length > 25 ? campaign.name.substring(0, 25) + '...' : campaign.name;
        ctx.fillText(campaignName, width / 2, 140);

        // --- 4. QR Code ---
        const qrSize = 500;
        const qrX = (width - qrSize) / 2;
        const qrY = 180;

        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        const fontSize = 30;
        const lineHeight = 35;
        ctx.font = `bold ${fontSize}px ${interStack}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let maxTextWidth = 0;
        CENTER_TEXT_LINES.forEach((line) => {
          const w = ctx.measureText(line).width;
          if (w > maxTextWidth) maxTextWidth = w;
        });

        const boxInnerPadding = 25;
        const totalTextHeight = CENTER_TEXT_LINES.length * lineHeight;
        const rawBoxWidth = maxTextWidth + boxInnerPadding;
        const rawBoxHeight = totalTextHeight + boxInnerPadding;
        const boxSize = Math.max(rawBoxWidth, rawBoxHeight);

        const qrCenterX = qrX + qrSize / 2;
        const qrCenterY = qrY + qrSize / 2;
        const rectX = qrCenterX - boxSize / 2;
        const rectY = qrCenterY - boxSize / 2;
        const ringSize = 8;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(rectX - ringSize, rectY - ringSize, boxSize + ringSize * 2, boxSize + ringSize * 2);

        ctx.strokeStyle = BRAND_COLOR;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        const cornerLen = 15;

        ctx.beginPath();
        ctx.moveTo(rectX, rectY + cornerLen);
        ctx.lineTo(rectX, rectY);
        ctx.lineTo(rectX + cornerLen, rectY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rectX + boxSize - cornerLen, rectY);
        ctx.lineTo(rectX + boxSize, rectY);
        ctx.lineTo(rectX + boxSize, rectY + cornerLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rectX + boxSize, rectY + boxSize - cornerLen);
        ctx.lineTo(rectX + boxSize, rectY + boxSize);
        ctx.lineTo(rectX + boxSize - cornerLen, rectY + boxSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rectX + cornerLen, rectY + boxSize);
        ctx.lineTo(rectX, rectY + boxSize);
        ctx.lineTo(rectX, rectY + boxSize - cornerLen);
        ctx.stroke();

        ctx.fillStyle = BRAND_COLOR;
        const startTextY = qrCenterY - ((CENTER_TEXT_LINES.length - 1) * lineHeight) / 2;
        CENTER_TEXT_LINES.forEach((line, index) => {
          ctx.fillText(line, qrCenterX, startTextY + index * lineHeight);
        });

        // --- 5. Wallet Address Section ---
        const walletBoxY = qrY + qrSize + 40;

        ctx.fillStyle = '#F3F4F6'; // Gray-100
        ctx.beginPath();
        ctx.roundRect(50, walletBoxY, width - 100, 120, 20);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        ctx.font = `bold 20px ${interStack}`;
        ctx.fillStyle = '#6B7280'; // Gray-500
        ctx.fillText('Wallet Address', width / 2, walletBoxY + 40);

        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = BRAND_COLOR; // Gray-800
        ctx.fillText(campaign.donation_wallet, width / 2, walletBoxY + 80);

        // --- 6. Instructions Section ---
        const instructionsY = walletBoxY + 160;

        ctx.fillStyle = '#374151'; // Gray-700
        ctx.font = `bold 28px ${interStack}`;
        ctx.fillText('How to Donate', width / 2, instructionsY);

        ctx.textAlign = 'left';
        ctx.font = '24px sans-serif';
        ctx.fillStyle = BRAND_COLOR; // Gray-600

        const stepX = 140;
        const stepGap = 50;
        const stepStartY = instructionsY + 50;

        ctx.fillText('1. Open your Mezon App', stepX, stepStartY);
        ctx.fillText('2. Scan the QR code above', stepX, stepStartY + stepGap);
        // Footer
        ctx.textAlign = 'center';
        ctx.font = `16px ${interStack}`;
        ctx.fillStyle = BRAND_COLOR;
        ctx.globalAlpha = 0.6;
        ctx.fillText('Powered by Mezon', width / 2, height - 30);
        ctx.globalAlpha = 1.0;

        canvas.toBlob((blob) => {
          callback(blob);
        }, 'image/png');
      }
    };
  };

  const handleDownloadQr = () => {
    getQrImage((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `campaign-qr-${campaign.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')}.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
      }
    });
  };

  return (
    <aside className="border-border bg-card/90 shadow-primary/10 dark:bg-dark-light/80 rounded-3xl border p-6 dark:border-white/10">
      <p className="text-brand-primary text-xs font-semibold tracking-[0.3em] uppercase">Donate</p>
      <h2 className="text-foreground mt-3 text-xl font-semibold dark:text-white">Send {APP_CONFIG.CHAIN_SYMBOL}</h2>
      <p className="text-muted-foreground mt-3 text-sm">Transactions appear instantly in the Recent Activity log.</p>

      <div className="mt-6 space-y-4">
        <div className="border-border bg-background/70 dark:bg-dark-light/70 rounded-2xl border p-4 dark:border-white/10">
          <p className="text-muted-foreground text-xs tracking-wide uppercase dark:text-gray-400">Wallet address</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-foreground truncate font-mono text-sm dark:text-gray-100">
              {truncateWalletAddress(campaign.donation_wallet)}
            </p>
            <CopyButton textToCopy={campaign.donation_wallet} />
          </div>
          <Link
            href={ROUTES.WALLET(campaign.donation_wallet)}
            className={cn(
              'text-brand-primary hover:text-primary-light mt-3 inline-flex items-center gap-1 text-xs font-medium transition',
              {
                hidden: !hidden,
              }
            )}
          >
            View on explorer
          </Link>
        </div>

        {/* QR Code Section */}
        <div className="border-brand-primary/40 bg-brand-primary/10 rounded-2xl border border-dashed p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-brand-primary text-xs font-semibold tracking-widest uppercase">Scan QR</p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-brand-primary hover:bg-brand-primary/20 h-6 w-6"
                onClick={handleDownloadQr}
                title="Download QR Card"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="mt-2 flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="group relative shrink-0">
              <div className="from-brand-primary/20 absolute -inset-1 rounded-xl bg-gradient-to-br to-purple-500/20 opacity-0 blur-lg transition duration-500 group-hover:opacity-100" />

              <div ref={qrRef} className="relative h-28 w-28 rounded-sm bg-white p-1 shadow-sm ring-1 ring-black/5">
                <QRCode
                  value={qrCodeValue}
                  className="h-full w-full object-contain"
                  viewBox={`0 0 256 256`}
                  level="H"
                />

                <div className="absolute top-1/2 left-1/2 flex aspect-square -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center bg-white p-1 shadow-sm ring-2 ring-white">
                  <span className="border-brand-primary absolute top-0 left-0 h-2 w-2 border-t-2 border-l-2" />
                  <span className="border-brand-primary absolute top-0 right-0 h-2 w-2 border-t-2 border-r-2" />
                  <span className="border-brand-primary absolute right-0 bottom-0 h-2 w-2 border-r-2 border-b-2" />
                  <span className="border-brand-primary absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2" />

                  {CENTER_TEXT_LINES.map((line, i) => (
                    <span key={i} className="text-brand-primary text-[7px] leading-[0.9] font-bold uppercase">
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-brand-primary/90 flex-1 text-xs">
              Open your Mezon App, scan the code, and specify the number of tokens.
            </div>
          </div>
        </div>

        {isAuthenticated && campaign.status == ECampaignStatus.Active && (
          <DonateDialog walletAddress={campaign.donation_wallet} campaignId={String(campaign.id)} />
        )}
        <p className="text-muted-foreground text-center text-xs">💡 Keep your transaction hash for reconciliation.</p>
      </div>
    </aside>
  );
}
