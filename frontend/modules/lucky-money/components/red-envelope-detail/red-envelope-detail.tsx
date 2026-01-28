'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import { truncateWalletAddress, formatClaimDate } from '../../utils';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import QRCode from 'react-qr-code';
import { CopyButton } from '@/components/ui/copy-button';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { BreadcrumbNavigation } from '@/components/shared';
import { useRedEnvelopeDetail } from '../../hooks/useRedEnvelopeDetail';
import { RedEnvelopeConfirmDialog } from '../create-red-envelope/confirm-transfer-dialog';
import React, { useState } from 'react';
import { RedEnvelopeIcon } from '@/assets/icons/red-evelop';

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Lucky Money', href: ROUTES.LUCKY_MONEY },
  { label: 'Lucky Money Detail', href: '#' },
] as const;

export const RedEnvelopeDetail = () => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    closeSession,
    isLoading,
    isError,
    refetch,
  } = useRedEnvelopeDetail();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="text-muted-foreground">Loading details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-800/20">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-600">Failed to load data</h2>
          <p className="text-sm text-red-600 dark:text-red-300">
            Could not fetch lucky money details. Please check your connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="rounded-md bg-red-700 px-4 py-2 text-white transition-colors hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const onOpenCloseSessionModal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isClosable && !isClosing) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmCloseSession = () => {
    setShowConfirmModal(false);
    closeSession();
  };

  return (
    <div className="text-foreground min-h-screen p-4 font-sans md:p-8 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 space-y-2 sm:space-y-4">
          <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
        </div>
        <header className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">🎁 {stats.name}</h1>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-muted-foreground font-mono text-sm md:text-lg dark:text-gray-400">Session ID:</h3>
              <h3 className="font-mono text-sm font-medium break-all text-purple-600 md:text-lg dark:text-purple-400">
                {truncateWalletAddress(redEnvelopeId || '')}
              </h3>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <span
              className={cn(
                'rounded-full border px-2 py-1 text-xs font-bold whitespace-nowrap md:px-3 md:text-sm',
                statusClassName
              )}
            >
              {displayedStatus}
            </span>
            <button
              onClick={onOpenCloseSessionModal}
              disabled={!isClosable || isClosing}
              className="dark:border-destructive dark:hover:bg-destructive/10 flex w-auto cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold whitespace-nowrap text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent md:px-4 md:text-base dark:text-red-400"
            >
              {isClosing ? 'Closing...' : 'Close Session'}
            </button>
            <RedEnvelopeConfirmDialog
              open={showConfirmModal}
              onOpenChange={setShowConfirmModal}
              onConfirm={handleConfirmCloseSession}
              amount={stats.total_amount - stats.total_claimed_amount}
              isCreate={false}
            />
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8 xl:grid-cols-3">
          {statsCards.map((item) => {
            const cardClassName = cn('p-0', 'bg-card', 'dark:border-primary/15');
            return (
              <Card key={item.title} className={cardClassName}>
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-muted-foreground dark:text-gray-400">{item.title}</span>
                    </div>
                  </div>
                  <div className="my-4">
                    <span className="text-foreground text-2xl font-semibold break-words md:text-3xl dark:text-white">
                      {item.value}
                    </span>
                    {item.unit && (
                      <span className="text-foreground text-2xl font-semibold break-words md:text-3xl dark:text-white">
                        &nbsp;{item.unit} {item.subValue}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="bg-card border-border mb-8 rounded-lg border p-4 shadow-lg md:p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 md:mb-6 md:text-xl dark:text-white">
            Share Lucky Money
          </h2>
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-stretch md:gap-6">
            <div className="relative w-auto max-w-[220px] shrink-0 rounded-lg bg-white p-2 md:p-3 dark:bg-white">
              <QRCode value={qrCodeValue} size={qrSize} style={{ width: '100%', height: 'auto' }} level="H" />

              <div className="absolute top-1/2 left-1/2 flex h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white p-0.5">
                <RedEnvelopeIcon className="h-full w-full object-contain" />
              </div>
            </div>
            <div className="flex w-full grow flex-col gap-4">
              <div>
                <div className="relative w-full">
                  <div className="bg-background border-border text-foreground w-full truncate rounded-lg border p-2 pr-10 font-mono text-xs md:p-3 md:pr-12 md:text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200">
                    {truncateWalletAddress(claimLink, truncateChars)}
                  </div>
                  <div className="absolute top-1/2 right-2 -translate-y-1/2 transform">
                    <CopyButton textToCopy={claimLink} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border-border overflow-hidden rounded-lg border shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[520px] text-left md:min-w-[700px]">
              <thead className="border-border border-b dark:border-slate-700">
                <tr>
                  <th className="text-muted-foreground p-2 text-xs font-semibold uppercase md:p-4 md:text-sm dark:text-gray-400">
                    Wallet
                  </th>
                  <th className="text-muted-foreground p-2 text-xs font-semibold uppercase md:p-4 md:text-sm dark:text-gray-400">
                    Amount (Đồng)
                  </th>
                  <th className="text-muted-foreground p-2 text-xs font-semibold uppercase md:p-4 md:text-sm dark:text-gray-400">
                    Claimed At
                  </th>
                  <th className="text-muted-foreground p-2 text-xs font-semibold uppercase md:p-4 md:text-sm dark:text-gray-400">
                    TX Hash
                  </th>
                </tr>
              </thead>
              <tbody>
                {recipients?.map((item, index) => (
                  <tr
                    key={index}
                    className="border-border hover:bg-muted/50 border-b dark:border-slate-700 dark:hover:bg-slate-700/50"
                  >
                    <td className="p-2 font-mono text-xs break-all text-purple-600 md:p-4 md:text-sm dark:text-purple-400">
                      {truncateWalletAddress(item.claimer_wallet)}
                    </td>
                    <td className="text-foreground p-2 font-mono text-xs md:p-4 md:text-sm dark:text-gray-400">
                      {item.amount.toLocaleString('en-US')}
                    </td>
                    <td className="text-foreground p-2 text-xs md:p-4 md:text-sm dark:text-gray-400">
                      {formatClaimDate(item.claimed_at, true)}
                    </td>
                    <td className="p-2 font-mono text-xs break-all text-purple-600 md:p-4 md:text-sm dark:text-purple-400">
                      {truncateWalletAddress(item.transaction_hash)}
                    </td>
                  </tr>
                ))}
                {(!recipients || recipients.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground p-4 text-center">
                      No recipients yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
