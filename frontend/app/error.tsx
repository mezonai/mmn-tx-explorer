'use client';

import { ErrorScreen } from '@/components/shared/error-screen';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      error={error}
      reset={reset}
      title="Application Error"
      description="A server-side exception has occurred while loading this page. Please try again or contact support if the problem persists."
    />
  );
}
