import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UseQueryParamProps<T> {
  queryParam: string;
  defaultValue: T;
  clearParams?: string[];
}

export const useQueryParam = <T extends string | number>({
  queryParam,
  defaultValue,
  clearParams,
}: UseQueryParamProps<T>) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get(queryParam);
  const value =
    raw == null || raw === '' ? defaultValue : typeof defaultValue === 'number' ? (Number(raw) as T) : (raw as T);

  const handleChangeValue = (value: T) => {
    const params = new URLSearchParams(searchParams);

    if (clearParams?.length) {
      clearParams.forEach((key) => {
        if (key !== queryParam) {
          params.delete(key);
        }
      });
    }

    params.set(queryParam, String(value));
    router.push(`${pathname}?${params.toString()}`);
  };

  return { value, handleChangeValue };
};
