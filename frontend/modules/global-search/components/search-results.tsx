import { MiddleTruncate } from '@re-dev/react-truncate';

import { Cube01, Transaction } from '@/assets/icons';
import { ROUTES } from '@/configs/routes.config';
import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { ISearchResult } from '../types';
import { SearchResultItem } from './search-result-item';
import { Wallet } from 'lucide-react';

interface SearchResultsProps {
  isLoading: boolean;
  searchResults: ISearchResult | null;
  onItemSelect: () => void;
}

export const SearchResults = ({ isLoading, searchResults, onItemSelect }: SearchResultsProps) => {
  if (isLoading) {
    return <p>We are searching, please wait...</p>;
  }

  if (!searchResults?.blocks?.length && !searchResults?.transactions?.length && !searchResults?.wallets?.length) {
    return <p>No results found.</p>;
  }

  return (
    <div className="space-y-4">
      {searchResults.transactions?.length > 0 && (
        <div className="space-y-2">
          <p className="text-tertiary-600 text-sm font-semibold">Transactions</p>
          <div className="space-y-1">
            {searchResults.transactions.map((transaction) => (
              <SearchResultItem
                key={transaction.hash}
                href={ROUTES.TRANSACTION(transaction.hash)}
                icon={Transaction}
                title={<MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS}>{transaction.hash}</MiddleTruncate>}
                timestamp={transaction.transaction_timestamp}
                onItemSelect={onItemSelect}
              />
            ))}
          </div>
        </div>
      )}

      {searchResults.blocks?.length > 0 && (
        <div className="space-y-2">
          <p className="text-tertiary-600 text-sm font-semibold">Blocks</p>
          <div className="space-y-2">
            {searchResults.blocks.map((block) => (
              <SearchResultItem
                key={block.block_number}
                href={ROUTES.BLOCK(block.block_number)}
                icon={Cube01}
                title={<span>{block.block_number}</span>}
                timestamp={block.block_timestamp}
                onItemSelect={onItemSelect}
              />
            ))}
          </div>
        </div>
      )}

      {searchResults.wallets?.length > 0 && (
        <div className="space-y-2">
          <p className="text-tertiary-600 text-sm font-semibold">Wallets</p>
          <div className="space-y-2">
            {searchResults.wallets.map((wallet) => (
              <SearchResultItem
                key={wallet.address}
                href={ROUTES.WALLET(wallet.address)}
                icon={Wallet}
                title={<span>{wallet.address}</span>}
                onItemSelect={onItemSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
