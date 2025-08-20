'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { SearchMd } from '@/assets/icons';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { SearchService } from '../api';
import { ISearchResult } from '../types';
import { SearchResults } from './search-results';

export const GlobalSearch = () => {
  const [query, setQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<ISearchResult | null>(null);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isShowSearchResults =
    isFocused && query && (searchResults?.transactions?.length || searchResults?.blocks?.length);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  useEffect(() => {
    let isCancelled = false;

    const runSearch = async () => {
      const trimmed = debouncedQuery.trim();
      if (trimmed.length === 0) {
        setSearchResults(null);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await SearchService.search(trimmed);
        if (!isCancelled) {
          setSearchResults(data);
        }
      } catch {
        if (!isCancelled) {
          setSearchResults(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    runSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex-1" ref={containerRef} onFocus={() => setIsFocused(true)}>
      <SearchMd className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2 transform" />
      <Input placeholder="Search by txn hash / block" className="pl-10" value={query} onChange={handleChange} />

      {isShowSearchResults && (
        <div className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-50 mt-2 max-h-[50dvh] overflow-y-auto rounded-md border shadow-md">
          <div className="text-muted-foreground p-3 text-sm">
            <SearchResults isLoading={isLoading} searchResults={searchResults} />
          </div>
        </div>
      )}
    </div>
  );
};
