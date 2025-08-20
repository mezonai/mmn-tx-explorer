import { ISearchResult } from '../types';
import { BlockSearchResultItem } from './block-search-result-item';
import { TransactionSearchResultItem } from './transaction-search-result-item';

export const SearchResults = ({
  isLoading,
  searchResults,
}: {
  isLoading: boolean;
  searchResults: ISearchResult | null;
}) => {
  if (isLoading) {
    return <p>We are searching, please wait...</p>;
  }

  if (!searchResults) {
    return <p>No results found.</p>;
  }

  return (
    <div className="space-y-5">
      {searchResults.transactions?.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-bold">Transactions</p>
          <div className="space-y-1">
            {searchResults.transactions.map((transaction) => (
              <TransactionSearchResultItem key={transaction.hash} transaction={transaction} />
            ))}
          </div>
        </div>
      )}

      {searchResults.blocks?.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-bold">Blocks</p>
          <div className="space-y-1">
            {searchResults.blocks.map((block) => (
              <BlockSearchResultItem key={block.block_number} block={block} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
