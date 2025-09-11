import { Virtualizer } from '@tanstack/react-virtual';
import { RefObject, useCallback, useEffect } from 'react';
import { usePaginationQueryParam } from './usePaginationQueryParam';

export const useResetTable = (
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>,
  isVirtualized: boolean,
  seenIndexesRef: RefObject<Set<number>>
) => {
  const { page: currentPage } = usePaginationQueryParam();
  const resetTable = useCallback(() => {
    seenIndexesRef.current.clear();

    if (rowVirtualizer) {
      rowVirtualizer.scrollToIndex(0);
    }
    if (isVirtualized) {
      rowVirtualizer.measure();
    }
  }, [seenIndexesRef, rowVirtualizer, isVirtualized]);

  useEffect(() => {
    if (currentPage) {
      resetTable();
    }
  }, [currentPage, resetTable]);
};
