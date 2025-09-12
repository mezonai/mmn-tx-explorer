'use client';

import { ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => {
      if (items && getItemKey) return getItemKey(items[index] as T, index);
      return index;
    },
  });
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
