'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { BlockService, IBlock, IBLockListParams } from '@/modules/block';
import { IPaginationMeta, TTableColumn } from '@/types';

const DEFAULT_VALUE_DATA_SEARCH: IBLockListParams = {
  page: 1,
  limit: 10,
  sort_by: 'block_number',
  sort_order: 'desc',
} as const;

export const BlockList = () => {
  const urlSearchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'all' | 'forked' | 'uncles'>('all');
  const [blocks, setBlocks] = useState<IBlock[]>([]);
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [localSearchParams, setLocalSearchParams] = useState<IBLockListParams>();

  const columns: TTableColumn<IBlock>[] = [
    {
      headerName: 'Block',
      valueGetter: (row) => {
        return (
          <Button variant="link" asChild>
            <Link href={`/blocks/${row.block_number}`}>{row.block_number}</Link>
          </Button>
        );
      },
    },
    {
      headerName: 'Size, bytes',
      field: 'size',
    },
    {
      headerName: 'Validator',
      field: 'miner',
    },
    {
      headerName: 'Txn',
      field: 'transaction_count',
    },
    {
      headerName: 'Gas used',
      field: 'gas_used',
    },
    {
      headerName: 'Reward ETH',
      valueGetter: () => {
        return '0';
      },
    },
    {
      headerName: 'Burnt fees ETH',
      valueGetter: () => {
        return '0';
      },
    },
    {
      headerName: 'Base fee',
      valueGetter: () => {
        return '0';
      },
    },
  ];

  const handleFetchBlocks = async (params: IBLockListParams) => {
    try {
      setIsLoading(true);
      const { data, meta } = await BlockService.getBlocks(params);
      setBlocks(data);
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
    handleFetchBlocks(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Blocks</h1>

      <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
        <div className="flex items-center gap-1 self-start">
          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('all')}
            disabled={isLoading}
          >
            All
          </Button>
          <Button
            variant={activeTab === 'forked' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('forked')}
            disabled={isLoading}
          >
            Forked
          </Button>
          <Button
            variant={activeTab === 'uncles' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('uncles')}
            disabled={isLoading}
          >
            Uncles
          </Button>
        </div>
        {localSearchParams && (
          <TablePagination page={localSearchParams.page} onPageChange={handleChangePage} disabled={isLoading} />
        )}
      </div>

      <Table columns={columns} rows={blocks} isLoading={isLoading} />
    </div>
  );
};
