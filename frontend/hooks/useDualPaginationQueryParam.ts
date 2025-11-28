import { useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function useDualPaginationQueryParam() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get page/limit for verified
  const verifiedPage = parseInt(searchParams.get('verifiedPage') || '1', 10);
  const verifiedLimit = parseInt(searchParams.get('verifiedLimit') || '10', 10);

  // Get page/limit for unverified
  const unverifiedPage = parseInt(searchParams.get('unverifiedPage') || '1', 10);
  const unverifiedLimit = parseInt(searchParams.get('unverifiedLimit') || '10', 10);

  // Handlers for updating query params
  const handleChangeVerifiedPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(window.location.search);
      // remove default page 1 from query string to keep URL clean
      if (page === 1) params.delete('verifiedPage');
      else params.set('verifiedPage', String(page));
      router.replace(`${window.location.pathname}?${params}`, { scroll: false });
    },
    [router]
  );

  const handleChangeVerifiedLimit = useCallback(
    (limit: number) => {
      const params = new URLSearchParams(window.location.search);
      // remove default limit (10) to avoid unnecessary query params
      if (limit === 10) params.delete('verifiedLimit');
      else params.set('verifiedLimit', String(limit));
      router.replace(`${window.location.pathname}?${params}`, { scroll: false });
    },
    [router]
  );

  const handleChangeUnverifiedPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(window.location.search);
      if (page === 1) params.delete('unverifiedPage');
      else params.set('unverifiedPage', String(page));
      router.replace(`${window.location.pathname}?${params}`, { scroll: false });
    },
    [router]
  );

  const handleChangeUnverifiedLimit = useCallback(
    (limit: number) => {
      const params = new URLSearchParams(window.location.search);
      if (limit === 10) params.delete('unverifiedLimit');
      else params.set('unverifiedLimit', String(limit));
      router.replace(`${window.location.pathname}?${params}`, { scroll: false });
    },
    [router]
  );

  return {
    verifiedPage,
    verifiedLimit,
    unverifiedPage,
    unverifiedLimit,
    handleChangeVerifiedPage,
    handleChangeVerifiedLimit,
    handleChangeUnverifiedPage,
    handleChangeUnverifiedLimit,
  };
}
