'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useResetTable } from '@/hooks/useResetTable';

type VirtualizedListProps<T> = {
  items?: T[];
  isLoading?: boolean;
  isEmpty?: boolean;
  skeletonCount?: number;
  estimateSize?: number;
  overscan?: number;
  maxHeight?: number;
  minItemsForVirtualization?: number;
  getItemKey?: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  renderSkeletonItem?: (index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
  className?: string;
  itemClassName?: string;
};

export function VirtualizedList<T>({
  items,
  isLoading = false,
  isEmpty = false,
  skeletonCount = 0,
  estimateSize = 100,
  overscan = 8,
  maxHeight = 600,
  minItemsForVirtualization = 50,
  getItemKey,
  renderItem,
  renderSkeletonItem,
  renderEmpty,
  className,
  itemClassName,
}: VirtualizedListProps<T>) {
  const shouldShowSkeleton = isLoading;
  const itemCount = items?.length ?? 0;
  const isVirtualized = !shouldShowSkeleton && !isEmpty && itemCount >= minItemsForVirtualization;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const seenIndexesRef = useRef<Set<number>>(new Set());
  const lastCountRef = useRef<number>(itemCount);

  // Reset seen indexes when list shrinks
  useEffect(() => {
    if (itemCount < lastCountRef.current) {
      seenIndexesRef.current.clear();
    }
    lastCountRef.current = itemCount;
  }, [itemCount]);

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
    // Keep already-seen items mounted; reduces scrollbar flicker
    rangeExtractor: (range) => {
      const seen = seenIndexesRef.current;
      for (let i = range.startIndex; i <= range.endIndex; i++) seen.add(i);
      return Array.from(seen).sort((a, b) => a - b);
    },
    getItemKey: (index) => {
      if (items && getItemKey) return getItemKey(items[index] as T, index);
      return index;
    },
  });
  useResetTable(virtualizer, isVirtualized, seenIndexesRef);
  if (shouldShowSkeleton) {
    return (
      <div className={className}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i}>{renderSkeletonItem ? renderSkeletonItem(i) : null}</div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return <>{renderEmpty ? renderEmpty() : null}</>;
  }

  if (!isVirtualized) {
    return (
      <div className={className}>
        {items?.map((item, i) => {
          const key = getItemKey ? String(getItemKey(item, i)) : i;
          return (
            <div key={key} className={itemClassName}>
              {renderItem(item, i)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={className ? `${className} overflow-y-auto` : 'overflow-y-auto'}
      style={{ maxHeight }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const index = vi?.index;
          const item = items?.[index];
          if (item === undefined) return null;
          const key = getItemKey ? String(getItemKey(item, index)) : vi.key;
          return (
            <div key={key} className="absolute top-0 left-0 w-full" style={{ transform: `translateY(${vi.start}px)` }}>
              <div className={itemClassName} ref={virtualizer.measureElement} data-index={index}>
                {renderItem(item, index)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
