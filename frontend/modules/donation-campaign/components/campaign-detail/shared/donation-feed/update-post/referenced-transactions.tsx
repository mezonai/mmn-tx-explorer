import { Chip } from '@/components/shared/chip';
import { Accordion, AccordionTrigger, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';

interface ReferencedTransactionsProps {
  referencedTxns?: string[];
}
export const ReferencedTransactions = ({ referencedTxns }: ReferencedTransactionsProps) => {
  const refTxCount = referencedTxns?.length || 0;
  return (
    <Accordion type="single" collapsible className="border-border relative mx-3 rounded-md border">
      <AccordionItem value="referenced-txns">
        <AccordionTrigger className="text-md cursor-pointer px-3 text-left font-medium hover:no-underline">
          <span>
            Referenced Transaction(s){' '}
            <Chip variant="primary" size="sm" className="ml-3">
              {refTxCount}
            </Chip>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          {referencedTxns?.map((txHash, index) => (
            <div className="flex w-full flex-row items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-800" key={txHash}>
              <span className="px-2">#{index + 1}</span>
              <TxnHashLink key={txHash} hash={txHash} isPending={false} hasTooltip={false} />
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
