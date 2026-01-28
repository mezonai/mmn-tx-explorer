import { IDonationFeed } from '@/modules/donation-campaign/type';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { ReferencedTransactions } from './referenced-transactions';

interface UpdatePostFooterProps {
  isHidden: boolean;
  update: IDonationFeed;
}

export const UpdatePostFooter = ({ isHidden, update }: UpdatePostFooterProps) => {
  return (
    <>
      {!isHidden && update.reference_tx_hashes && update.reference_tx_hashes.length > 0 && (
        <ReferencedTransactions referencedTxns={update.reference_tx_hashes} />
      )}
      {!isHidden && (
        <div className="flex w-full flex-row justify-end gap-4 px-4">
          <span className="text-sm">TxHash: </span>
          <span className="w-40">
            <TxnHashLink hash={update.tx_hash} isPending={false} className="text-brand-primary" />
          </span>
        </div>
      )}
    </>
  );
};
