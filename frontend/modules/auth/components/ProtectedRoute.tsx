'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthActions, useUser } from '@/providers/AppProvider';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  title?: string;
  header?: string;
  description?: string;
  children: ReactNode;
}

export const ProtectedRoute = ({
  title = 'Protected Page',
  header = 'Login Required',
  description = 'You must be logged in to access this page.',
  children,
}: ProtectedRouteProps) => {
  const { login } = useAuthActions();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    setHasUser(!!user);
    setIsLoading(false);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <p className="text-primary">Loading...</p>
      </div>
    );
  }

  if (!hasUser) {
    return (
      <div className="h-full w-full px-4 sm:px-6 lg:px-8">
        <PageHeader title={title} header={header} description={description} />
        <div className="shadow-brand-primary/20 border-brand-primary/50 mx-auto mt-8 w-full max-w-3xl rounded-3xl border p-6 text-center shadow-md">
          <p className="text-primary mb-4 text-sm">You must be logged in to use this feature.</p>
          <Button onClick={login} className="bg-brand-primary hover:bg-brand-primary/40 text-brand-primary-background rounded-xl px-6 py-3">
            Log in
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
