import Link from 'next/link';

import { Clock } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { ITransaction } from '@/modules/transaction';
import { TTableColumn } from '@/types';
import { DateTimeUtil } from '@/utils';
import { FromToAddresses, MethodBadge, MoreInfoButton, TxnHashLink, TypeBadges } from '../shared';

interface TransactionsTableProps {
  transactions?: ITransaction[];
}

export const TransactionsTable = ({ transactions }: TransactionsTableProps) => {
  const columns: TTableColumn<ITransaction>[] = [
    {
      valueGetter: () => <MoreInfoButton />,
    },
    {
      header: (
        <div className="flex items-center gap-1">
          <span>TXN Hash</span>
          <Button variant="ghost" size="icon" className="p-0">
            <Clock className="text-muted-foreground size-4" />
          </Button>
        </div>
      ),
      valueGetter: (row) => {
        return (
          <div className="flex flex-col items-start">
            <TxnHashLink hash={row.hash} className="w-40" />
            <span className="text-muted-foreground text-sm">
              {DateTimeUtil.formatRelativeTime(row.block_timestamp * 1000)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Type',
      field: 'transaction_type',
      valueGetter: () => <TypeBadges className="flex-col items-start" />,
    },
    {
      header: 'Method',
      valueGetter: (row) => <MethodBadge method={row.function_selector} />,
    },
    {
      header: 'Block',
      valueGetter: (row) => {
        return (
          <Button variant="link" className="p-0" asChild>
            <Link href={`/blocks/${row.block_number}`}>{row.block_number}</Link>
          </Button>
        );
      },
    },
    {
      header: 'From/To',
      valueGetter: (row) => <FromToAddresses fromAddress={row.from_address} toAddress={row.to_address} />,
    },
    {
      header: 'Value ETH',
      field: 'value',
    },
  ];

  return <Table columns={columns} rows={transactions} />;
};
