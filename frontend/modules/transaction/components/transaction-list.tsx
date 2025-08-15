'use client';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { IPaginationMeta, TTableColumn } from '@/types';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: 1,
  limit: 10,
  sort_by: 'block_timestamp',
  sort_order: 'desc',
} as const;

export const TransactionsList = () => {
  const urlSearchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'validated' | 'pending' | 'blob'>('validated');
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [localSearchParams, setLocalSearchParams] = useState<ITransactionListParams>();

  const columns: TTableColumn<ITransaction>[] = [
    {
      headerName: 'Txn hash',
      field: 'hash',
      valueGetter: (row) => {
        return (
          <Button variant="link" asChild>
            <Link href={`/transactions/${row.hash}`}>{row.hash}</Link>
          </Button>
        );
      },
    },
    {
      headerName: 'Type',
      field: 'transaction_type',
    },
    {
      headerName: 'Method',
      field: 'function_selector',
    },
    {
      headerName: 'Block',
      field: 'block_number',
    },
    {
      headerName: 'From/To',
      field: 'from_address',
    },
    {
      headerName: 'Value ETH',
      field: 'value',
    },
    {
      headerName: 'Fee ETH',
      field: 'gas_price',
    },
  ];

  const handleFetchTransactions = async (params: ITransactionListParams) => {
    try {
      setIsLoading(true);
      const { data, meta } = await TransactionService.getTransactions(params);
      setTransactions(data);
      setPagination(meta);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePage = (page: number) => {
    if (!pagination?.total_pages) return;
    if (page >= 1 && page <= pagination.total_pages) {
      const currentParams = new URLSearchParams(urlSearchParams.toString());
      currentParams.set('page', page.toString());
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page: Number(urlSearchParams.get('page')) || 1,
    });
  }, [urlSearchParams]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchTransactions(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input placeholder="Search by address / txn hash / block / token..." className="pl-10" />
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">Transactions</p>
            <p>
              <strong className="text-lg font-bold">1,804,233</strong> (24h)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">Pending transactions</p>
            <p>
              <strong className="text-lg font-bold">415</strong> (30min)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">Transactions fees</p>
            <p>
              <strong className="text-lg font-bold">556.28</strong> ETH (24h)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">Avg. transaction fee</p>
            <p>
              <strong className="text-lg font-bold">$1.47</strong> (24h)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
        <div className="flex items-center gap-1 self-start">
          <Button
            variant={activeTab === 'validated' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('validated')}
            disabled={isLoading}
          >
            Validated
          </Button>
          <Button
            variant={activeTab === 'pending' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pending')}
            disabled={isLoading}
          >
            Pending
          </Button>
          <Button
            variant={activeTab === 'blob' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('blob')}
            disabled={isLoading}
          >
            Blob txns
          </Button>
        </div>
        {localSearchParams && (
          <div className="flex items-center gap-2 self-end">
            <Button variant="outline" size="sm" onClick={() => handleChangePage(1)} disabled={isLoading}>
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangePage(localSearchParams.page - 1)}
              disabled={isLoading}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="default" size="sm">
              {localSearchParams.page}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangePage(localSearchParams.page + 1)}
              disabled={isLoading}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <Table columns={columns} rows={transactions} isLoading={isLoading} />
    </div>
  );
};
