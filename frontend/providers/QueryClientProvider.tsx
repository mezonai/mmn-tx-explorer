// In Next.js, this file would be called: app/providers.tsx
'use client';

import { DEFAULT_STALE_TIME } from '@/constant';
// Since QueryClientProvider relies on useContext under the hood, we have to put 'use client' on top
import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // above 0 to avoid refetching immediately on the client
        staleTime: DEFAULT_STALE_TIME,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error) => {
          if (error instanceof Error && 'response' in error) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 401 && !!(axiosError.response?.data as any)?.retry) {
              return failureCount < 1;
            }
          }

          return false;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
