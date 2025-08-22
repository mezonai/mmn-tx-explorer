import { useEffect, useState } from 'react';

import { EBreakpoint } from '@/enums';

export function useBreakpoint(breakpoint: EBreakpoint): boolean | undefined {
  const [isAtLeast, setIsAtLeast] = useState<boolean | undefined>();

  useEffect(() => {
    const minWidth = breakpoint;
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);

    const onChange = (event: MediaQueryListEvent) => {
      setIsAtLeast(event.matches);
    };

    setIsAtLeast(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isAtLeast;
}
