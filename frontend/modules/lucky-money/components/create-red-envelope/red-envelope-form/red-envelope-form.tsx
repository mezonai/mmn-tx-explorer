'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreateRedEnvelopeContext } from '@/modules/lucky-money/context/CreateRedEnvelopeContext';
import { BasicInfo } from './red-envelope-basic-info';
import { ExpirySettings } from './expiry-setting';
import { RedEnvelopeConfirmDialog } from '../confirm-transfer-dialog';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';
import { CreateRedEnvelopeForm } from '@/modules/lucky-money/type';

export function RedEnvelopeForm() {
  const router = useRouter();
  const {
    methods,
    initiateCreation,
    isPending,
    isSuccess,
    showConfirmModal,
    setShowConfirmModal,
    confirmCreation,
    totalAmount,
  } = useCreateRedEnvelopeContext();

  const {
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = methods;

  const onSubmit = (data: CreateRedEnvelopeForm) => {
    initiateCreation(data);
  };

  const handleButtonClick = () => {
    if (isSuccess) {
      router.push(ROUTES.LUCKY_MONEY);
    }
  };

  const getButtonLabel = () => {
    if (isPending) return 'Processing...';
    if (isSuccess) return 'Back to Lucky Money Dashboard';
    return 'Create Lucky Money';
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <Card className="bg-card border-border dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <CardTitle className="text-foreground text-sm leading-tight font-bold sm:text-base md:text-lg">
                Create new Lucky Money session
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <BasicInfo />
            <ExpirySettings />

            <Button
              type={isSuccess ? 'button' : 'submit'}
              onClick={isSuccess ? handleButtonClick : undefined}
              disabled={(!isValid && !isSuccess) || isPending || isSubmitting}
              className="mt-4 w-full rounded-xl bg-[#ff496e] py-2 text-xs text-[#ffd54f] shadow-[0_0_20px_#ff496e66] transition duration-300 hover:bg-[#e03c5e] sm:mt-6 sm:rounded-2xl sm:py-2.5 sm:text-sm md:mt-8 md:py-3 md:text-base"
            >
              {getButtonLabel()}
            </Button>
          </CardContent>
        </Card>
      </form>
      <RedEnvelopeConfirmDialog
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={confirmCreation}
        amount={totalAmount}
        isCreate={true}
      />
    </>
  );
}
