'use client';

import { ErrorScreen } from '@/components/shared/error-screen';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <ErrorScreen
          error={error}
          reset={reset}
          title="Global Application Error"
          description="A critical error has occurred in the application. Please refresh the page or contact support if the problem persists."
        />
      </body>
    </html>
  );
}
