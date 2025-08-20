import { ArrowLeft, ArrowRight } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  isLoading?: boolean;
  className?: string;
  onChangePage: (page: number) => void;
}

export const Pagination = ({ page, totalPages, isLoading = false, className, onChangePage }: PaginationProps) => {
  if (page <= 1) {
    page = 1;
  }
  if (page >= totalPages) {
    page = totalPages;
  }

  const handleChangePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChangePage(page);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        className="px-3.5 py-2.5 text-sm font-semibold"
        onClick={() => handleChangePage(1)}
        disabled={isLoading || page <= 1}
      >
        First
      </Button>
      <div className="flex">
        <Button
          variant="outline"
          className="rounded-tr-none rounded-br-none p-2.5"
          onClick={() => handleChangePage(page - 1)}
          disabled={isLoading || page <= 1}
        >
          <ArrowLeft className="text-muted-foreground size-5" />
        </Button>
        <div className="bg-primary/8 flex aspect-square h-[37px] items-center justify-center">
          <p className="text-foreground text-sm font-semibold">{page}</p>
        </div>
        <Button
          variant="outline"
          className="rounded-tl-none rounded-bl-none p-2.5"
          onClick={() => handleChangePage(page + 1)}
          disabled={isLoading || page >= totalPages}
        >
          <ArrowRight className="text-muted-foreground size-5" />
        </Button>
      </div>
    </div>
  );
};
