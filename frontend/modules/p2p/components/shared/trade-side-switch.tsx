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
        <div className={cn('bg-input/30 dark:bg-input/30 flex rounded-lg border border-gray-700 p-1', className)}>
            <button
                type="button"
                onClick={() => onChange(TradeTypes.SELL)}
                className={cn(
                    'flex-1 rounded-md py-1.5 text-xs font-bold transition-all',
                    value === TradeTypes.SELL ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white',
                    classNameButton
                )}
            >
                SELL
            </button>
            <button
                type="button"
                onClick={() => onChange(TradeTypes.BUY)}
                className={cn(
                    'flex-1 rounded-md py-1.5 text-xs font-bold transition-all',
                    value === TradeTypes.BUY ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white',
                    classNameButton
                )}
            >
                BUY
            </button>
        </div>
    );
};
