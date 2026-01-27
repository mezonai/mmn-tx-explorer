'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreateRedEnvelopeContext } from '@/modules/lucky-money/context/CreateRedEnvelopeContext';
import { BasicInfo } from './red-envelope-basic-info';
import { ExpirySettings } from './expiry-setting';
import { RedEnvelopeConfirmDialog } from '../confirm-transfer-dialog';

export function RedEnvelopeForm() {
  const { initiateCreation, isPending, isSuccess } = useCreateRedEnvelopeContext();

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initiateCreation();
  };

  return (
    <>
      <form onSubmit={onFormSubmit}>
        <Card className="bg-card border-border dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <CardTitle className="text-foreground text-sm leading-tight font-bold sm:text-base md:text-lg dark:text-white">
                Create new Lucky Money session
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <BasicInfo />
            <ExpirySettings />

            <Button
              type="submit"
              disabled={isPending || isSuccess}
              className="mt-4 w-full rounded-xl bg-[#ff496e] py-2 text-xs text-[#ffd54f] shadow-[0_0_20px_#ff496e66] transition duration-300 hover:bg-[#e03c5e] sm:mt-6 sm:rounded-2xl sm:py-2.5 sm:text-sm md:mt-8 md:py-3 md:text-base"
            >
              {isPending ? 'Processing...' : 'Create Lucky Money'}
            </Button>
          </CardContent>
        </Card>
      </form>
      <RedEnvelopeConfirmDialog />
    </>
  );
}
