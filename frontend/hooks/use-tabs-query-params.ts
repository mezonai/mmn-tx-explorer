import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Hook to manage tabs (active, switch tab) using value from query params
 * @param defaultTab - The default active tab
 * @param queryParam - The query param to use for the tab
 * @returns The active tab and the function to handle the tab change
 */
export const useTabsQueryParams = ({ defaultTab, queryParam = 'tab' }: { defaultTab: string; queryParam?: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get(queryParam) || defaultTab || undefined;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(queryParam, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return { tab, handleTabChange };
};
