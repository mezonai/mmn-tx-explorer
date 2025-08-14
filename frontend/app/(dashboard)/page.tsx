import {
  ArrowLeftRight,
  Box,
  Clock,
  Copy,
  Info,
  MoveDown,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/routes';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
            <Box className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">1,234</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <ArrowLeftRight className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">56,789</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Block Time
            </CardTitle>
            <Clock className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">~2.5s</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Wallet (token balance)
            </CardTitle>
            <Wallet className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">1,234,567</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 lg:grid-cols-9">
        <div className="space-y-4 lg:col-span-3">
          <div>
            <p className="text-lg font-bold">Latest blocks</p>
            <p className="text-muted-foreground text-sm">
              Network utilization: <strong>48.60%</strong>
            </p>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 rounded-lg">
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Box className="size-5" />
                      <p className="text-lg font-bold">{23131192 - i + 1}</p>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {15 + i * 5}s ago
                    </p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span>Txn:</span>
                      <span className="font-medium">{150 + i * 7}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Reward:</span>
                      <span className="font-medium">
                        {(0.009 + i * 0.001).toFixed(10)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Validator:</span>
                      <span className="font-medium">0x39...Aa49</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex w-full justify-center">
            <Button variant="link" asChild>
              <Link href={ROUTES.BLOCKS}>View all blocks</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-6">
          <div>
            <p className="text-lg font-bold">Latest transactions</p>
          </div>
          <div className="divide divide-y-1 divide-solid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col gap-4 py-4 sm:gap-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span className="cursor-default rounded bg-orange-100 px-2 py-1 text-xs text-orange-800 sm:text-sm">
                        {i % 2 === 0 ? 'Coin transfer' : 'Token transfer'}
                      </span>
                      <span className="cursor-default rounded bg-green-100 px-2 py-1 text-xs text-green-800 sm:text-sm">
                        Success
                      </span>
                      <div className="text-muted-foreground text-xs sm:text-sm">
                        {i}h ago
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="size-4 flex-shrink-0" />
                      <span className="line-clamp-1 flex-1 truncate text-sm font-medium sm:text-base">
                        0xf54d304a...f067
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Info className="size-4" />
                  </Button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <MoveDown className="size-4 flex-shrink-0" />
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="size-4 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
                        <span className="truncate text-sm font-medium">
                          {i % 2 === 0
                            ? 'testcore.eth'
                            : '0x63a1b2c3d4e5f678901234567890abcdef'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="ml-6 flex min-w-0 items-center gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="size-4 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                        <span className="truncate text-sm font-medium">
                          {i % 2 === 0
                            ? '0x9876543210fedcba0987654321abcdef'
                            : 'testcore.eth'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 space-y-2">
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">Value:</span>
                      <span className="font-medium">0.00019 ETH</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-medium">0.00001 ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex w-full justify-center">
            <Button variant="link" asChild>
              <Link href={ROUTES.TRANSACTIONS}>View all transactions</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
