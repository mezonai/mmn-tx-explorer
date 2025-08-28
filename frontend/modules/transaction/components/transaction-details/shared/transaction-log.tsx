import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CopyButton } from '@/components/ui/copy-button';
import { Table } from '@/components/ui/table';
import { ILogInputData, ITransactionLog } from '@/modules/transaction/types';
import { TTableColumn } from '@/types';
import { Truncate } from '@re-dev/react-truncate';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { LogAttribute } from './log-attribute';

interface TransactionLogProps {
  log: ITransactionLog;
}

export const TransactionLog = ({ log }: TransactionLogProps) => {
  return (
    <AccordionItem value={log.id.toString()} className="rounded-md border!">
      <AccordionTrigger className="bg-muted data-[state=open]:bg-primary/8 rounded-b-none p-3">
        Log #{log.id}
      </AccordionTrigger>
      <AccordionContent className="space-y-6 border-t p-3">
        <LogAttribute
          label="Address"
          render={
            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground size-4.5" />
              <Link href={'/address/0x123'} className="text-primary font-bold">
                {log.address}
              </Link>
              <CopyButton className="hidden md:flex" textToCopy={log.address} />
            </div>
          }
        />
        <LogAttribute
          label="Decode input data"
          render={
            <div className="space-y-2 md:space-y-4">
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <span className="font-semibold">Method ID</span>
                <span>{log.decode_input_data.method_id}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <span className="font-semibold">Call</span>
                <span>{log.decode_input_data.call}</span>
              </div>
              <LogInputDataTable inputs={log.decode_input_data.inputs} />
            </div>
          }
        />
        <LogAttribute
          label="Topics"
          render={
            <div className="space-y-2">
              {log.topics.map((topic, index) => (
                <LogTopic key={index} index={index} value={topic} />
              ))}
            </div>
          }
        />
        <LogAttribute label="Data" render={<Truncate>{log.data}</Truncate>} />
      </AccordionContent>
    </AccordionItem>
  );
};

const logDataColumns: TTableColumn<ILogInputData>[] = [
  {
    headerContent: 'Name',
    dataKey: 'name',
  },
  {
    headerContent: 'Type',
    dataKey: 'type',
  },
  {
    headerContent: 'Indexed',
    renderCell: (row) => <span>{row.indexed ? 'true' : 'false'}</span>,
  },
  {
    headerContent: 'Data',
    renderCell: (row) => <LogTableDataColumn row={row} />,
  },
];

const LogInputDataTable = ({ inputs }: { inputs: ILogInputData[] }) => {
  return <Table columns={logDataColumns} rows={inputs} />;
};

const LogTableDataColumn = ({ row }: { row: ILogInputData }) => {
  switch (row.type) {
    case 'address':
      return (
        <div className="flex items-center">
          <Link href={`/address/${row.data}`} className="text-primary">
            {row.data}
          </Link>
          <CopyButton textToCopy={row.data} />
        </div>
      );
    case 'uint256':
      return <span>{row.data}</span>;
    default:
      return <span>{row.data}</span>;
  }
};

const LogTopic = ({ index, value }: { index: number; value: string }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex size-5 items-center justify-center rounded-full border-1 border-blue-400 bg-blue-50 font-bold text-blue-400">
        {index}
      </div>
      <div className="flex-grow">
        <Truncate>{value}</Truncate>
        <CopyButton textToCopy={value} />
      </div>
    </div>
  );
};
