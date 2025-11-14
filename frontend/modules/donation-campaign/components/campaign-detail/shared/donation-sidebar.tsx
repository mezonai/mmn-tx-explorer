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
import { useHidden } from '../provider';
import QRCode from 'react-qr-code';

export function DonationSidebar({ campaign }: { campaign: DonationCampaign }) {
  const { isAuthenticated } = useAuth();
  const { hidden } = useHidden();
  const qrCodeValue = JSON.stringify({ type: 'transfer_wallet', wallet_address: campaign.donation_wallet });
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
        <div className="border-brand-primary/40 bg-brand-primary/10 rounded-2xl border border-dashed p-4">
          <p className="text-brand-primary text-xs font-semibold tracking-widest uppercase">Scan QR</p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="dark:bg-dark h-28 w-28 rounded-2xl bg-white p-2 shadow-inner">
              <QRCode value={qrCodeValue} className="h-auto w-full max-w-full" />
            </div>
            <div className="text-brand-primary/90 flex-1 text-xs">
              Open your Mezon App, scan the code, and specify the number of tokens.
            </div>
          </div>
        </div>
        {isAuthenticated && campaign.status == ECampaignStatus.Active && (
          <DonateDialog walletAddress={campaign.donation_wallet} />
        )}
        <p className="text-muted-foreground text-center text-xs">💡 Keep your transaction hash for reconciliation.</p>
      </div>
    </aside>
  );
}
