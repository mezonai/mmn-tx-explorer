import { MiddleTruncate } from '@re-dev/react-truncate';

import { Cube01, Transaction } from '@/assets/icons';
import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { ISearchResult } from '../types';
import { SearchResultItem } from './search-result-item';

interface SearchResultsProps {
  isLoading: boolean;
  searchResults: ISearchResult | null;
  onSelect: () => void;
}

export const SearchResults = ({ isLoading, searchResults, onSelect }: SearchResultsProps) => {
  if (isLoading) {
    return <p>We are searching, please wait...</p>;
  }

  if (!searchResults?.blocks?.length && !searchResults?.transactions?.length) {
    return <p>No results found.</p>;
  }

  return (
    <div className="space-y-4">
      {searchResults.transactions?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Transactions</p>
          <div className="space-y-1">
            {searchResults.transactions.map((transaction) => (
              <SearchResultItem
                key={transaction.hash}
                href={`/transactions/${transaction.hash}`}
                icon={Transaction}
                title={<MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS}>{transaction.hash}</MiddleTruncate>}
                timestamp={transaction.block_timestamp}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {searchResults.blocks?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Blocks</p>
          <div className="space-y-2">
            {searchResults.blocks.map((block) => (
              <SearchResultItem
                key={block.block_number}
                href={`/blocks/${block.block_number}`}
                icon={Cube01}
                title={<span>{block.block_number}</span>}
                timestamp={block.block_timestamp}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
