'use client';

import { CopyButton } from '@/components/ui/copy-button';
import { DonationCampaign } from '@/modules/donation-campaign/type';
import { useAuth } from '@/providers';
import { DonateDialog } from './donate-dialog';
import { truncateWalletAddress } from '@/modules/donation-campaign/utils';
import Link from 'next/link';
import { ROUTES } from '@/configs/routes.config';
import { APP_CONFIG } from '@/configs/app.config';

export function DonationSidebar({ campaign }: { campaign: DonationCampaign }) {
  const { isAuthenticated } = useAuth();

  return (
    <aside className="border-border bg-card/90 shadow-primary/10 dark:bg-dark-light/80 rounded-3xl border p-6 dark:border-white/10">
      <p className="text-brand-primary text-xs font-semibold tracking-[0.3em] uppercase">Donate</p>
      <h2 className="text-foreground mt-3 text-xl font-semibold dark:text-white">Send {APP_CONFIG.CHAIN_SYMBOL}</h2>
      <p className="text-muted-foreground mt-3 text-sm dark:text-gray-400">
        100% of your contribution is allocated to construction, learning resources, and student well-being. Transactions
        appear instantly in the Recent activity log.
      </p>

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
            className="text-brand-primary hover:text-primary-light mt-3 inline-flex items-center gap-1 text-xs font-medium transition"
          >
            View on explorer
          </Link>
        </div>
        {/* phase 2 */}
        {/* <div className="border-primary/40 bg-primary/5 dark:border-primary/40 dark:bg-primary/15 rounded-2xl border border-dashed p-4">
          <p className="text-primary dark:text-primary-light text-xs font-semibold tracking-widest uppercase">
            Scan QR
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="dark:bg-dark h-28 w-28 rounded-2xl bg-white p-3 shadow-inner">
              <img src="#" alt="QR Code for donation" className="h-full w-full rounded-xl object-cover" />
            </div>
            <div className="text-primary/90 dark:text-primary-light/80 flex-1 text-xs">
              Open your MMN wallet, scan the code, and specify the number of tokens. Helpful hint: 100 MMN ≈ 500,000
              VND.
            </div>
          </div>
        </div> */}
        {/* Donate Button */}
        {isAuthenticated && <DonateDialog walletAddress={campaign.donation_wallet} />}
        <p className="text-muted-foreground text-center text-xs dark:text-gray-400">
          💡 Keep your transaction hash for reconciliation.
        </p>
      </div>
    </aside>
  );
}
