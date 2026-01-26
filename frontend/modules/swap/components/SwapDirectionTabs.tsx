'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { TokenSymbol } from '@/constant/token.constant';

interface SwapDirectionTabsProps {
  direction: 'wmzd-to-mzd' | 'mzd-to-wmzd';
  onDirectionChange: (direction: 'wmzd-to-mzd' | 'mzd-to-wmzd') => void;
}

export const SwapDirectionTabs = ({ direction, onDirectionChange }: SwapDirectionTabsProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:justify-center md:gap-4">
      <Button
        variant={direction === 'wmzd-to-mzd' ? 'default' : 'outline'}
        onClick={() => onDirectionChange('wmzd-to-mzd')}
        className="w-full px-6 py-3 text-sm font-medium md:w-auto md:min-w-[200px] md:text-base"
      >
        {`${TokenSymbol.WMezon} → ${TokenSymbol.Mezon}`}
      </Button>
      <div className="relative w-full md:w-auto">
        <Button
          variant="outline"
          disabled
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="w-full cursor-not-allowed px-6 py-3 text-sm font-medium opacity-50 md:min-w-[200px] md:text-base"
        >
          {`${TokenSymbol.Mezon} → ${TokenSymbol.WMezon}`}
        </Button>
      </div>
    </div>
  );
};
