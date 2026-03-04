import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { APP_CONFIG } from '@/configs/app.config';
import { cn } from '@/lib/utils';

interface AvailableAmountFilterProps {
    onFilterChange: (min: number | undefined, max: number | undefined) => void;
    className?: string;
}

export const AvailableAmountFilter = ({ onFilterChange, className }: AvailableAmountFilterProps) => {
    const [minAmount, setMinAmount] = useState<string>('');
    const [maxAmount, setMaxAmount] = useState<string>('');

    useEffect(() => {
        const timer = setTimeout(() => {
            const minVal = minAmount ? Number(minAmount) : undefined;
            const maxVal = maxAmount ? Number(maxAmount) : undefined;
            onFilterChange(minVal, maxVal);
        }, 500);

        return () => clearTimeout(timer);
    }, [minAmount, maxAmount, onFilterChange]);

    return (
        <div className={cn('bg-background border-input ring-offset-background focus-within:ring-brand-primary flex h-10 w-full items-center rounded-lg border shadow-sm focus-within:ring-1 md:w-auto', className)}>
            <div className="bg-muted/50 text-brand-primary flex h-full items-center border-r px-3 text-[10px] font-bold tracking-wider uppercase select-none">
                Available amount
            </div>

            {/* Min Input */}
            <div className="relative flex flex-1 items-center md:w-32">
                <Input
                    type="text"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="border-0 bg-transparent pr-9 pl-3 text-sm shadow-none focus-visible:ring-0"
                />
                <span className="text-muted-foreground pointer-events-none absolute right-3 text-[12px] font-bold">
                    {APP_CONFIG.CHAIN_SYMBOL}
                </span>
            </div>

            <span className="text-muted-foreground px-1">-</span>

            {/* Max Input */}
            <div className="relative flex flex-1 items-center md:w-32">
                <Input
                    type="text"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="border-0 bg-transparent pr-9 pl-3 text-sm shadow-none focus-visible:ring-0"
                />
                <span className="text-muted-foreground pointer-events-none absolute right-3 text-[12px] font-bold">
                    {APP_CONFIG.CHAIN_SYMBOL}
                </span>
            </div>
        </div>
    );
};
