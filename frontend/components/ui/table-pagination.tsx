import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export function TablePagination({
  page,
  onPageChange,
  disabled = false,
}: {
  page: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 self-end">
      <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={disabled}>
        First
      </Button>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={disabled}>
        <ChevronLeft className="size-4" />
      </Button>
      <Button variant="default" size="sm">
        {page}
      </Button>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={disabled}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
