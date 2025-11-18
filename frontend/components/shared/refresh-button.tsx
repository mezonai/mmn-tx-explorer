import { useDebounceFunction } from '@/hooks';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';

function RefreshButton({
  onClick,
  isLoading,
  startDelay,
  delay,
}: {
  onClick: () => void;
  isLoading: boolean;
  startDelay?: number;
  delay?: number;
}) {
  const { debouncedFunction: debouncedRefresh, isDebouncing } = useDebounceFunction({
    fn: onClick,
    startDelay,
    delay,
  });

  const isButtonDisabled = isLoading || isDebouncing;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={debouncedRefresh}
      disabled={isButtonDisabled}
      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
      title={isLoading ? 'Please wait before refreshing again' : 'Refresh data'}
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      <span className="sr-only">{isLoading ? 'Please wait before refreshing again' : 'Refresh data'}</span>
    </Button>
  );
}
export { RefreshButton };
