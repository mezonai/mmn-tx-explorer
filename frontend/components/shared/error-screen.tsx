'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface ErrorScreenProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  description?: string;
  showRetry?: boolean;
  showHome?: boolean;
}

export const ErrorScreen = ({
  error,
  reset,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  showRetry = true,
  showHome = true,
}: ErrorScreenProps) => {
  const router = useRouter();
  const handleRetry = () => {
    if (reset) {
      reset();
    } else {
      router.refresh();
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          {/* Error Icon */}
          <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive h-8 w-8" />
          </div>

          {/* Error Content */}
          <div className="space-y-2">
            <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          </div>

          {error && (
            <div className="bg-muted w-full rounded-lg p-4 text-left">
              <div className="muted-foreground space-y-1 text-xs">
                <p>
                  <strong>Message:</strong> {error.message}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex w-full gap-3 sm:flex-row">
            {showRetry && (
              <Button onClick={handleRetry} className="flex-1" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {showHome && (
              <Button onClick={handleGoHome} className="flex-1" variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
