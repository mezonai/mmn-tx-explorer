import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LIMITS, PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import { NumberUtil } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface PaginationProps {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  isLoading?: boolean;
  className?: string;
  onChangePage: (page: number) => void;
  onChangeLimit: (limit: number) => void;
}

interface PaginationState {
  currentPage: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  showPreviousEllipsis: boolean;
  showNextEllipsis: boolean;
  showPreviousPage: boolean;
  showNextPage: boolean;
}

// Helper function to normalize page number
const normalizePage = (page: number, totalPages: number): number => {
  if (page <= PAGINATION.MIN_PAGE) return PAGINATION.MIN_PAGE;
  if (page >= totalPages) return totalPages;
  return page;
};

// Helper function to validate page change
const isValidPageChange = (targetPage: number, totalPages: number): boolean => {
  return targetPage >= PAGINATION.MIN_PAGE && targetPage <= totalPages;
};

// Helper function to calculate pagination state
const calculatePaginationState = (page: number, totalPages: number): PaginationState => {
  const currentPage = normalizePage(page, totalPages);

  return {
    currentPage,
    canGoPrevious: currentPage > PAGINATION.MIN_PAGE,
    canGoNext: currentPage < totalPages,
    showPreviousEllipsis: currentPage > PAGINATION.MIN_PAGE + 1,
    showNextEllipsis: currentPage < totalPages - 1,
    showPreviousPage: currentPage > PAGINATION.MIN_PAGE,
    showNextPage: currentPage < totalPages,
  };
};

// Component for navigation button with icon
const NavigationButton = ({
  icon: Icon,
  onClick,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  disabled: boolean;
  className?: string;
  'aria-label': string;
}) => (
  <Button
    variant="outline"
    className={cn('aspect-square size-10 p-2.5', className)}
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
  >
    <Icon className="text-muted-foreground size-5" strokeWidth={1.3} />
  </Button>
);

// Component for page number button
const PageButton = ({
  pageNumber,
  onClick,
  disabled,
  isEllipsis = false,
}: {
  pageNumber: number;
  onClick: () => void;
  disabled: boolean;
  isEllipsis?: boolean;
}) => (
  <Button
    variant="outline"
    className="hidden h-10 min-w-10 rounded-none p-2.5 md:block"
    onClick={onClick}
    disabled={disabled}
    aria-label={isEllipsis ? 'More pages' : `Go to page ${pageNumber}`}
  >
    <span className="text-foreground text-sm font-semibold">{isEllipsis ? '...' : pageNumber}</span>
  </Button>
);

export const Pagination = ({
  page,
  limit,
  totalPages,
  totalItems,
  isLoading = false,
  className,
  onChangePage,
  onChangeLimit,
}: PaginationProps) => {
  const {
    currentPage,
    canGoPrevious,
    canGoNext,
    showPreviousEllipsis,
    showNextEllipsis,
    showPreviousPage,
    showNextPage,
  } = calculatePaginationState(page, totalPages);

  // Handle page change with validation
  const handleChangePage = (targetPage: number) => {
    if (isLoading) return;

    if (isValidPageChange(targetPage, totalPages)) {
      onChangePage(targetPage);
    }
  };

  // Handle limit change
  const handleChangeLimit = (limitString: string) => {
    if (isLoading) return;

    const newLimit = Number(limitString);
    if (LIMITS.includes(newLimit as (typeof LIMITS)[number])) {
      onChangeLimit(newLimit);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:flex-nowrap', className)}>
      {/* Limit selector and total items display */}
      <div className="flex items-center gap-2">
        <Select value={limit.toString()} disabled={isLoading} onValueChange={handleChangeLimit}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={PAGINATION.DEFAULT_LIMIT.toString()} />
          </SelectTrigger>
          <SelectContent>
            {LIMITS.map((limitOption) => (
              <SelectItem key={limitOption} value={limitOption.toString()}>
                {limitOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-sm font-semibold whitespace-nowrap">
          of {NumberUtil.formatWithCommas(totalItems)}
        </span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center">
        {/* First page button */}
        <NavigationButton
          icon={ChevronsLeft}
          onClick={() => handleChangePage(PAGINATION.MIN_PAGE)}
          disabled={isLoading || !canGoPrevious}
          className="rounded-r-none"
          aria-label="Go to first page"
        />

        {/* Previous page button */}
        <NavigationButton
          icon={ChevronLeft}
          onClick={() => handleChangePage(currentPage - 1)}
          disabled={isLoading || !canGoPrevious}
          className="rounded-none"
          aria-label="Go to previous page"
        />

        {/* Previous ellipsis */}
        {showPreviousEllipsis && (
          <PageButton
            pageNumber={currentPage - PAGINATION.ELLIPSIS_THRESHOLD}
            onClick={() => handleChangePage(currentPage - PAGINATION.ELLIPSIS_THRESHOLD)}
            disabled={isLoading}
            isEllipsis
          />
        )}

        {/* Previous page number */}
        {showPreviousPage && (
          <PageButton
            pageNumber={currentPage - 1}
            onClick={() => handleChangePage(currentPage - 1)}
            disabled={isLoading}
          />
        )}

        {/* Current page indicator */}
        <div
          className="bg-primary/8 flex h-10 min-w-10 cursor-default items-center justify-center border p-2.5"
          aria-current="page"
          role="button"
          tabIndex={-1}
        >
          <span className="text-foreground text-sm font-semibold">{currentPage}</span>
        </div>

        {/* Next page number */}
        {showNextPage && (
          <PageButton
            pageNumber={currentPage + 1}
            onClick={() => handleChangePage(currentPage + 1)}
            disabled={isLoading}
          />
        )}

        {/* Next ellipsis */}
        {showNextEllipsis && (
          <PageButton
            pageNumber={currentPage + PAGINATION.ELLIPSIS_THRESHOLD}
            onClick={() => handleChangePage(currentPage + PAGINATION.ELLIPSIS_THRESHOLD)}
            disabled={isLoading}
            isEllipsis
          />
        )}

        {/* Next page button */}
        <NavigationButton
          icon={ChevronRight}
          onClick={() => handleChangePage(currentPage + 1)}
          disabled={isLoading || !canGoNext}
          className="rounded-none"
          aria-label="Go to next page"
        />

        {/* Last page button */}
        <NavigationButton
          icon={ChevronsRight}
          onClick={() => handleChangePage(totalPages)}
          disabled={isLoading || !canGoNext}
          className="rounded-l-none"
          aria-label="Go to last page"
        />
      </div>
    </div>
  );
};
