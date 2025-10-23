'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthActions, useUser } from '@/providers/AppProvider';
import { STORAGE_KEYS } from '@/constant';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface RequireAuthProps {
  title?: string;
  header?: string;
  description?: string;
  children: ReactNode;
}

export const RequireAuth = ({
  title = 'Protected Page',
  header = 'Login Required',
  description = 'You must be logged in to access this page.',
  children,
}: RequireAuthProps) => {
  const { login } = useAuthActions();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const userStored = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    setHasUser(!!userStored || !!user);
    setIsLoading(false);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!hasUser) {
    return (
      <div className="h-full w-full px-4 sm:px-6 lg:px-8">
        <PageHeader title={title} header={header} description={description} />
        <div className="border-primary/50 mx-auto mt-8 w-full max-w-3xl rounded-3xl border bg-white/5 p-6 text-center shadow-md dark:border-white/10">
          <p className="text-muted-foreground mb-4 text-sm">You must be logged in to use this feature.</p>
          <Button onClick={login} className="bg-primary hover:bg-primary-light rounded-xl px-6 py-3 text-white">
            Log in
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
