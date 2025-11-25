'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SwapDirectionTabsProps {
  direction: 'wmzd-to-mzd' | 'mzd-to-wmzd';
  onDirectionChange: (direction: 'wmzd-to-mzd' | 'mzd-to-wmzd') => void;
}

export const SwapDirectionTabs = ({ direction, onDirectionChange }: SwapDirectionTabsProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-3 mb-6 md:flex-row md:justify-center md:gap-4">
      <Button
        variant={direction === 'wmzd-to-mzd' ? 'default' : 'outline'}
        onClick={() => onDirectionChange('wmzd-to-mzd')}
        className="w-full md:w-auto md:min-w-[200px] px-6 py-3 text-sm md:text-base font-medium"
      >
        WMezon → Mezon
      </Button>
      <div className="relative w-full md:w-auto">
        <Button
          variant="outline"
          disabled
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="w-full md:min-w-[200px] px-6 py-3 text-sm md:text-base font-medium opacity-50 cursor-not-allowed"
        >
          Mezon → WMezon
        </Button>
      </div>
    </div>
  );
};
