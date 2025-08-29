import { Accordion } from '@/components/ui/accordion';
import { ITransactionLog } from '@/modules/transaction/types';
import { TransactionLog } from './transaction-log';

export const TabLogs = () => {
  const logs: ITransactionLog[] = [
    {
      id: 800,
      address: 'Renzo DAO Treasury: Staking & Restaking Fees',
      decode_input_data: {
        method_id: '3d0ce9cf',
        call: '0x3d0ce9cf',
        inputs: [
          {
            name: 'sender',
            type: 'address',
            indexed: true,
            data: '0xabc123def4567890ghijklmnopqrstu1234567890vwxyz1234567890abcdef',
          },
          {
            name: 'value',
            type: 'uint256',
            indexed: false,
            data: 'ef4567890gh',
          },
        ],
      },
      topics: [
        '0xabc123def4567890ghijklmnopqrstu1234567890vwxyz1234567890abcdef',
        '0xabc123def4567890ghijklmnopqrstu1234567890vwxyz1234567890abcdef',
      ],
      data: '0xabc123def4567890ghijklmnopqrstu1234567890vwxyz1234567890abcdef',
    },
    {
      id: 801,
      address: 'Renzo DAO Treasury: Staking & Restaking Fees',
      decode_input_data: {
        method_id: '3d0ce9cf',
        call: '0x3d0ce9cf',
        inputs: [
          {
            name: 'sender',
            type: 'address',
            indexed: true,
            data: '0xabc123def4567890ghijklmnopqrstu1234567890vwxyz1234567890abcdef',
          },
        ],
      },
      topics: [
        '0xabc123def4567890ghijklmnopqrstu1234567890vwxyz1234567890abcdef',
        '0xabc123def4567890ghijklmnopqrstu1234567890vwxyz1234567890abcdef',
      ],
      data: '0xabc123def4567890ghijklmnopqrstu1234567890vwxyz1234567890abcdef',
    },
  ];

  return (
    <Accordion type="multiple" className="space-y-4" defaultValue={[logs[0].id.toString()]}>
      {logs.map((log) => (
        <TransactionLog key={log.id} log={log} />
      ))}
    </Accordion>
  );
};
