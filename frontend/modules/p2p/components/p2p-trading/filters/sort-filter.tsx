import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SortFilterProps {
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
}

export const SortFilter = ({ value, onChange, className }: SortFilterProps) => {
    return (
        <div className={cn('w-full md:w-52', className)}>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="bg-background h-10 w-full">
                    <SelectValue placeholder="Sort by price" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="rate_asc">Rate: Low → High</SelectItem>
                    <SelectItem value="rate_desc">Rate: High → Low</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};
