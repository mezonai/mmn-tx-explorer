'use client';

import { ChangeEvent, useEffect, useState } from 'react';

import { SearchMd } from '@/assets/icons';
import { useDebounce } from '@/hooks';
import { cn } from '@/lib/utils';
import { SearchService } from '../api';
import { ISearchResult } from '../types';
import { Button } from '@/components/ui/button';
import { SearchModal } from './search-modal';

interface GlobalSearchProps {
  className?: string;
}

export const GlobalSearch = ({ className }: GlobalSearchProps) => {
  const [query, setQuery] = useState<string>('');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<ISearchResult | null>(null);
  const debouncedQuery = useDebounce(query, 400);

  const openSheet = () => {
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setQuery('');
      setSearchResults(null);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleClearQuery = () => {
    setQuery('');
  };
  const handleItemSelect = () => {
    handleSheetOpenChange(false);
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
    const handleCommandK = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openSheet();
      }
    };

    if (!isSheetOpen) {
      document.addEventListener('keydown', handleCommandK);
    }

    return () => {
      document.removeEventListener('keydown', handleCommandK);
    };
  }, [isSheetOpen]);

  return (
    <>
      <Button onClick={openSheet} variant={'outline'} className={cn('justify-start rounded-md', className)}>
        <SearchMd className="text-foreground-quaternary-400 size-5" strokeWidth={1.5} />
        <p className="text-foreground-quaternary-400">Search</p>
      </Button>

      <SearchModal
        isOpen={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
        query={query}
        onQueryChange={handleChange}
        onClearQuery={handleClearQuery}
        isLoading={isLoading}
        searchResults={searchResults}
        onItemSelect={handleItemSelect}
      />
    </>
  );
};
