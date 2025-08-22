import { ITransaction } from '@/modules/transaction/types';
import { TTableColumn } from '@/types';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Table } from '../ui/table';

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

export function TransactionsTable({
  transactions,
  isLoading = false,
}: {
  transactions: ITransaction[];
  isLoading?: boolean;
}) {
  return <Table columns={columns} rows={transactions} isLoading={isLoading} />;
}
