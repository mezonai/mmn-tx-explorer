'use client';

import { ChangeEvent, useEffect, useRef } from 'react';
import { SearchMd, XCircle } from '@/assets/icons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SearchResults } from './search-results';
import { ISearchResult } from '../types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearQuery: () => void;
  isLoading: boolean;
  searchResults: ISearchResult | null;
}

export const SearchModal = ({
  isOpen,
  onOpenChange,
  query,
  onQueryChange,
  onClearQuery,
  isLoading,
  searchResults,
}: SearchModalProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isShowSearchResults = query && searchResults;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Delay focus to ensure sheet animation completes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="top-16 left-1/2 mx-auto h-auto max-h-[80vh] w-full max-w-2xl -translate-x-1/2 rounded-lg [&>button]:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Global Search</SheetTitle>
          <SheetDescription>Search transactions, blocks, and addresses</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          {/* Search Input */}
          <div className="relative">
            <SearchMd
              className="text-foreground-quaternary-400 absolute top-1/2 left-3 z-10 size-5 -translate-y-1/2 transform"
              strokeWidth={1.5}
            />
            <Input
              ref={inputRef}
              placeholder="Search by txn hash / block number / wallet address"
              className={cn('h-12 border-none pl-10 text-sm shadow-none focus-visible:ring-0', query && 'pr-10')}
              value={query}
              onChange={onQueryChange}
            />
            {query && (
              <button
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 size-fit -translate-y-1/2 transform cursor-pointer p-2 transition-colors"
                onClick={onClearQuery}
              >
                <XCircle className="size-4" strokeWidth={1} />
              </button>
            )}
          </div>

          {isShowSearchResults && (
            <div className="max-h-96 overflow-y-auto border-t">
              <div className="text-muted-foreground px-4 py-4 text-sm">
                <SearchResults isLoading={isLoading} searchResults={searchResults} />
              </div>
            </div>
          )}

          {!query && (
            <div className="text-muted-foreground border-t px-4 py-8 text-center">
              <p className="mb-2 text-sm">Start typing to search transactions, blocks, or addresses</p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span>
                  Press <kbd className="bg-muted rounded px-2 py-1 text-xs">Esc</kbd> to close
                </span>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
