'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  ArrowDown,
  ArrowNarrowRight,
  CheckCircle,
  Copy01,
  CreditCardRefresh,
  Cube01,
  Hourglass01,
  InfoSquare,
  Transaction,
  Wallet02,
} from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/config/routes';

export const Dashboard = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/8 p-0">
          <CardContent className="space-y-5 p-5">
            <div>
              <div className="bg-background w-fit rounded-lg border p-3">
                <Cube01 className="size-6" />
              </div>
            </div>
            <div className="space-y-2 font-semibold">
              <p className="text-sm">Total Blocks</p>
              <p className="text-3xl">8,746</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/8 p-0">
          <CardContent className="space-y-5 p-5">
            <div>
              <div className="bg-background w-fit rounded-lg border p-3">
                <CreditCardRefresh className="size-6" />
              </div>
            </div>
            <div className="space-y-2 font-semibold">
              <p className="text-sm">Total Transactions</p>
              <p className="text-3xl">12,440</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/8 p-0">
          <CardContent className="space-y-5 p-5">
            <div>
              <div className="bg-background w-fit rounded-lg border p-3">
                <Hourglass01 className="size-6" />
              </div>
            </div>
            <div className="space-y-2 font-semibold">
              <p className="text-sm">Average Block Time</p>
              <p className="text-3xl">96</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/8 p-0">
          <CardContent className="space-y-5 p-5">
            <div>
              <div className="bg-background w-fit rounded-lg border p-3">
                <Wallet02 className="size-6" />
              </div>
            </div>
            <div className="space-y-2 font-semibold">
              <p className="text-sm">Total Wallet (Token Balance)</p>
              <p className="text-3xl">96</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-9">
        <div className="col-span-1 space-y-4 lg:col-span-3">
          <div>
            <h2 className="text-lg font-semibold">Latest Blocks</h2>
            <p className="text-muted-foreground text-sm">
              Network utilization: <strong className="text-primary font-semibold">48.60%</strong>
            </p>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-0">
                <CardContent className="p-5">
                  <div className="mb-3 flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Cube01 className="text-primary size-6" />
                      <Button variant="link" asChild className="p-0">
                        <Link
                          href={ROUTES.BLOCK.replace(':id', (23131192 - i + 1).toString())}
                          className="text-primary text-xl font-medium"
                        >
                          {23131192 - i + 1}
                        </Link>
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-base">{15 + i * 5}s ago</p>
                  </div>
                  <div className="space-y-2 text-base">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Txn</span>
                      <span className="font-medium">{150 + i * 7}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Reward:</span>
                      <span className="font-medium">{(0.009 + i * 0.001).toFixed(10)} MMN</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Validator:</span>
                      <span className="text-primary font-medium">0x39...Aa49</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex w-full justify-center">
            <Button variant="link" className="font-medium" asChild>
              <Link href={ROUTES.BLOCKS}>View all blocks</Link>
            </Button>
          </div>
        </div>

        <div className="col-span-1 space-y-4 lg:col-span-6">
          <div>
            <h2 className="text-xl font-semibold">Latest Transactions</h2>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-start gap-4 border-b pb-4 lg:flex-row lg:items-center">
                <div className="w-full flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <div className="cursor-default rounded-lg border border-orange-200 bg-orange-50 px-1.5 py-1">
                        <span className="text-orange-700">{i % 2 === 0 ? 'Coin transfer' : 'Token transfer'}</span>
                      </div>
                      <div className="flex cursor-default items-center justify-center gap-1 rounded-lg border px-1.5 py-1">
                        <CheckCircle className="size-3 text-green-600" />
                        <span>Success</span>
                      </div>
                    </div>
                    <div className="block lg:hidden">
                      <Button variant="ghost" size="icon">
                        <InfoSquare className="text-muted-foreground size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Transaction className="text-muted-foreground size-6" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="link"
                          className="h-fit flex-1 justify-start p-0 text-sm font-semibold lg:flex-none"
                          asChild
                        >
                          <Link
                            href={ROUTES.TRANSACTION.replace(
                              ':id',
                              '0x4a8eddcbf0df174f3c77681e4ec3c0571000efc84246b42233826e1f45aeda16'
                            )}
                          >
                            0xf54d304a...f067
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        0x4a8eddcbf0df174f3c77681e4ec3c0571000efc84246b42233826e1f45aeda16
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-muted-foreground text-sm">{i}h ago</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="hidden lg:block">
                      <ArrowDown className="text-muted-foreground size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-row gap-3 lg:flex-col">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="size-4 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
                          <span className="text-primary truncate text-sm font-normal">
                            {i % 2 === 0 ? 'testcore.eth' : '0x6b8...d7b6'}
                          </span>
                          <Tooltip open={copiedAddress === (i % 2 === 0 ? 'testcore.eth' : '0x6b8...d7b6')}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() => handleCopy(i % 2 === 0 ? 'testcore.eth' : '0x6b8...d7b6')}
                              >
                                <Copy01 className="text-muted-foreground size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copied!</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="flex items-center justify-center lg:hidden">
                        <ArrowNarrowRight className="text-muted-foreground size-4" />
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="size-4 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                          <span className="text-primary truncate text-sm font-normal">
                            {i % 2 === 0 ? '0x6b8...d7b6' : 'testcore.eth'}
                          </span>
                          <Tooltip open={copiedAddress === (i % 2 === 0 ? '0x6b8...d7b6' : 'testcore.eth')}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() => handleCopy(i % 2 === 0 ? '0x6b8...d7b6' : 'testcore.eth')}
                              >
                                <Copy01 className="text-muted-foreground size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copied!</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex w-full justify-between gap-2 text-sm font-medium lg:w-auto lg:justify-center">
                  <div className="flex flex-col gap-2">
                    <span>Value</span>
                    <span>Fee</span>
                  </div>
                  <div className="text-muted-foreground flex flex-col gap-2">
                    <span className="font-medium">0.00019 ETH</span>
                    <span className="font-medium">0.00001 ETH</span>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <InfoSquare className="text-muted-foreground size-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>More information</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
          <div className="flex w-full justify-center">
            <Button variant="link" className="font-medium" asChild>
              <Link href={ROUTES.TRANSACTIONS}>View all transactions</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
