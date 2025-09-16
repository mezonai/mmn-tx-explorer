import { LoaderIcon } from 'lucide-react';

export const PageLoading = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <LoaderIcon className="animate-spin" />
    </div>
  );
};
