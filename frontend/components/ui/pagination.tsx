'use client';

import ReactPaginate from 'react-paginate';

import { ChevronLeft, ChevronLeftDouble, ChevronRight, ChevronRightDouble } from '@/assets/icons';
import { DEFAULT_PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import { TOnChangePage } from '@/types';

type PaginationProps = {
  page: number;
  totalPages: number;
  onChangePage: TOnChangePage;
  className?: string;
};

export const Pagination = ({ page, totalPages, onChangePage, className }: PaginationProps) => {
  const isFirstPage = page <= 1;
  const isLastPage = totalPages <= 0 || page >= totalPages;

  const baseBtnClass =
    'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center border text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

  return (
    <div className={cn('flex items-center justify-center select-none', className)}>
      <button
        type="button"
        className={cn(baseBtnClass, 'rounded-l-lg border', isFirstPage && 'pointer-events-none opacity-50')}
        disabled={isFirstPage}
        aria-label="Go to first page"
        onClick={() => onChangePage(1)}
      >
        <ChevronLeftDouble className="text-muted-foreground size-4" />
      </button>

      <ReactPaginate
        breakLabel="..."
        previousLabel={<ChevronLeft className="text-muted-foreground size-4" />}
        nextLabel={<ChevronRight className="text-muted-foreground size-4" />}
        forcePage={Math.max(0, page - 1)}
        marginPagesDisplayed={DEFAULT_PAGINATION.MARGIN_RANGE_DISPLAY}
        pageCount={Math.max(0, totalPages)}
        disableInitialCallback={true}
        renderOnZeroPageCount={null}
        className="flex items-center justify-center"
        breakLinkClassName={cn(baseBtnClass, 'rounded-none')}
        pageLinkClassName={cn(baseBtnClass, 'rounded-none')}
        previousLinkClassName={cn(baseBtnClass)}
        nextLinkClassName={cn(baseBtnClass)}
        activeLinkClassName="!bg-primary/8 !text-foreground pointer-events-none"
        disabledLinkClassName="opacity-50 pointer-events-none"
        onPageChange={({ selected }) => {
          onChangePage(selected + 1);
        }}
      />

      <button
        type="button"
        className={cn(baseBtnClass, 'rounded-r-lg border', isLastPage && 'pointer-events-none opacity-50')}
        disabled={isLastPage}
        aria-label="Go to last page"
        onClick={() => onChangePage(totalPages)}
      >
        <ChevronRightDouble className="text-muted-foreground size-4" />
      </button>
    </div>
  );
};
