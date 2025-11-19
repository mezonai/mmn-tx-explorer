'use client';

import { ExternalLink } from 'lucide-react';
import { UUID } from 'crypto';
import { truncateWalletAddress, formatClaimDate } from '../../utils';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import QRCode from 'react-qr-code';
import { CopyButton } from '@/components/ui/copy-button';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { BreadcrumbNavigation } from '@/components/shared';
import { useRedEnvelopeDetail } from '../../hooks/useRedEnvelopeDetail';

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Lucky Money', href: ROUTES.LI_XI},
  { label: 'Lucky Money Detail', href: '#' },
] as const;

export const RedEnvelopeDetail = () => {
  const {
    stats,
    recipients,
    redEnvelopeId,
    isClosing,
    displayedStatus,
    statusClassName,
    isClosable,
    statsCards,
    claimLink,
    qrCodeValue,
    qrSize,
    truncateChars,
    handleCloseSession,
  } = useRedEnvelopeDetail();

  return (
    <div className="min-h-screen text-foreground dark:text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 space-y-2 sm:space-y-4">
          <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
        </div>
        <header className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">🎁 {stats.name}</h1>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-sm md:text-lg text-muted-foreground dark:text-gray-400 font-mono">Session ID:</h3>
              <h3 className="text-sm md:text-lg font-medium text-purple-600 dark:text-purple-400 font-mono break-all">
                {truncateWalletAddress(redEnvelopeId || '')}
              </h3>
            </div>
          </div>
          <div className="flex items-stretch sm:items-center gap-2 sm:gap-4 flex-wrap w-full lg:w-auto">
            <span
              className={cn(
                'font-bold py-1 px-2 md:px-3 rounded-full text-xs md:text-sm border',
                statusClassName
              )}
            >
              {displayedStatus}
            </span>
            <button
              onClick={handleCloseSession}
              disabled={!isClosable || isClosing}
              className="flex items-center justify-center gap-2 border border-red-300 dark:border-[rgb(239_68_68_/_0.6)] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[rgb(239_68_68_/_0.1)] font-semibold py-2 px-3 md:px-4 rounded-lg transition-colors text-sm md:text-base cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent whitespace-nowrap w-full sm:w-auto"
            >
              {isClosing ? 'Closing...' : 'Close Session'}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8 mb-8">
          {statsCards.map((item) => {
            const isLoading = item.value === undefined;
            const cardClassName = cn(
              'p-0',
              isLoading ? 'bg-background' : 'bg-card',
              'dark:border-primary/15'
            );
            return (
              <Card key={item.title} className={cardClassName}>
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-muted-foreground dark:text-gray-400">{item.title}</span>
                    </div>
                  </div>
                  <div className="my-4">
                    <span className="text-2xl md:text-3xl font-semibold text-foreground dark:text-white break-words">
                      {item.value}
                    </span>
                    {item.unit && (
                      <span className="text-2xl md:text-3xl font-semibold text-foreground dark:text-white break-words">
                        &nbsp;{item.unit} {item.subValue}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
        
        <section className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 p-4 md:p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">Share Lucky Money</h2>
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-6">
            <div className="bg-white dark:bg-white p-2 md:p-3 rounded-lg flex-shrink-0 w-full md:w-auto max-w-[220px] self-stretch md:self-auto">
              <QRCode value={qrCodeValue} size={qrSize} style={{ width: '100%', height: 'auto' }} />
            </div>
            <div className="flex-grow w-full flex flex-col gap-4">
              <div>
                <div className="relative w-full">
                  <div className="bg-background dark:bg-slate-700 border border-border dark:border-slate-600 text-foreground dark:text-gray-200 p-2 md:p-3 pr-10 md:pr-12 rounded-lg font-mono text-xs md:text-sm truncate w-full">
                    {truncateWalletAddress(claimLink, truncateChars)}
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <CopyButton textToCopy={claimLink} />
                  </div>
                </div>
              </div>
              <a
                href={isClosable ? claimLink : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-center gap-2 w-full md:w-1/3 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base",
                  !isClosable && "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => {
                  if (!isClosable) {
                    e.preventDefault();
                  }
                }}
              >
                <span>Open Claim Page</span>
                <ExternalLink size={16} className="md:w-[18px] md:h-[18px]" />
              </a>
            </div>
          </div>
        </section>

        <section className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <table className="w-full min-w-[520px] md:min-w-[700px] text-left">
              <thead className="border-b border-border dark:border-slate-700">
                <tr>
                  <th className="p-2 md:p-4 uppercase text-xs md:text-sm font-semibold text-muted-foreground dark:text-gray-400">Wallet</th>
                  <th className="p-2 md:p-4 uppercase text-xs md:text-sm font-semibold text-muted-foreground dark:text-gray-400">Amount (Đồng)</th>
                  <th className="p-2 md:p-4 uppercase text-xs md:text-sm font-semibold text-muted-foreground dark:text-gray-400">Claimed At</th>
                  <th className="p-2 md:p-4 uppercase text-xs md:text-sm font-semibold text-muted-foreground dark:text-gray-400">TX Hash</th>
                </tr>
              </thead>
              <tbody>
                {recipients?.map((item, index) => (
                  <tr key={index} className="border-b border-border dark:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-700/50">
                    <td className="p-2 md:p-4 font-mono text-xs md:text-sm text-purple-600 dark:text-purple-400 break-all">{truncateWalletAddress(item.claimer_wallet)}</td>
                    <td className="p-2 md:p-4 font-mono text-xs md:text-sm text-foreground dark:text-gray-400">{item.amount.toLocaleString('en-US')}</td>
                    <td className="p-2 md:p-4 text-xs md:text-sm text-foreground dark:text-gray-400">{formatClaimDate(item.claimed_at, true)}</td>
                    <td className="p-2 md:p-4 font-mono text-xs md:text-sm text-purple-600 dark:text-purple-400 break-all">{truncateWalletAddress(item.transaction_hash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};