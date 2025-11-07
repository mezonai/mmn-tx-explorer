'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ApiErrorProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export const ApiError = ({
  onRetry,
  title = 'Failed to load data',
  description = 'There was an error loading the data. Please try again.',
}: ApiErrorProps) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Error Icon */}
        <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive h-6 w-6" />
        </div>

        {/* Error Content */}
        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};
