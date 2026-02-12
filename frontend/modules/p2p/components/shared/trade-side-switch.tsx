import { TradeTypes } from '@/modules/p2p/types';
import { cn } from '@/lib/utils';

interface TradeSideSwitchProps {
    value: TradeTypes;
    onChange: (value: TradeTypes) => void;
    className?: string;
    classNameButton?: string;
}

export const TradeSideSwitch = ({ value, onChange, className, classNameButton }: TradeSideSwitchProps) => {
    return (
        <div className={cn('bg-input/30 dark:bg-input/30 flex rounded-lg border border-gray-700/50 p-1', className)}>
            <button
                type="button"
                onClick={() => onChange(TradeTypes.BUY)}
                className={cn(
                    'flex-1 rounded-md py-2 px-8 text-sm font-semibold transition-all duration-200',
                    value === TradeTypes.BUY ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5',
                    classNameButton
                )}
            >
                Buy
            </button>
            <button
                type="button"
                onClick={() => onChange(TradeTypes.SELL)}
                className={cn(
                    'flex-1 rounded-md py-2 px-8 text-sm font-semibold transition-all duration-200',
                    value === TradeTypes.SELL ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5',
                    classNameButton
                )}
            >
                Sell
            </button>
        </div>
    );
};
