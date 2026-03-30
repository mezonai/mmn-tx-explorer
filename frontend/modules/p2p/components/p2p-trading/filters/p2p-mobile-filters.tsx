import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AvailableAmountFilter } from './available-amount-filter';
import { SortFilter } from './sort-filter';

interface P2PMobileFiltersProps {
    onFilterChange: (min: number | undefined, max: number | undefined) => void;
    sortValue?: string;
    onSortChange?: (value: string) => void;
}

export const P2PMobileFilters = ({ onFilterChange, sortValue, onSortChange }: P2PMobileFiltersProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 flex-none rounded-lg border-gray-700 bg-input/30 hover:bg-input/50">
                    <Filter className="h-4 w-4 text-gray-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] md:hidden border-border shadow-2xl p-4" align="end" sideOffset={8}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">Filter & Sort</h4>
                    </div>

                    <div className="space-y-3">
                        <AvailableAmountFilter onFilterChange={onFilterChange} className="w-full" />

                        <div className="space-y-1.5 px-0.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rate Order</label>
                            <SortFilter value={sortValue} onChange={onSortChange} className="w-full md:w-full" />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
