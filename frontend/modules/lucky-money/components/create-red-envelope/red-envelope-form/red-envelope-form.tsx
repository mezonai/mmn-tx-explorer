'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DistributionSettings } from './distribution-setting';
import { useCreateRedEnvelopeContext } from '@/modules/lucky-money/context/CreateRedEnvelopeContext';
import { BasicInfo } from './red-envelope-basic-info';
import { ExpirySettings } from './expiry-setting';

export function RedEnvelopeForm() {
  const { handleSubmit, isPending } = useCreateRedEnvelopeContext();

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
      handleSubmit(); 
  };
  return (
    <form onSubmit={onFormSubmit}>
      <Card className="bg-card dark:bg-white/5 border-border dark:border-white/10">
        <CardHeader >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
            <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-foreground dark:text-white leading-tight">Create new Lucky Money session</CardTitle>
          </div>
        </CardHeader>

        <CardContent >
          <BasicInfo />
          <DistributionSettings />
          <ExpirySettings />
          <Button
            type="submit"
            disabled={isPending}
            className="
              mt-4 sm:mt-6 md:mt-8 w-full 
              bg-[#ff496e] 
              text-[#ffd54f] 
              rounded-xl sm:rounded-2xl 
              shadow-[0_0_20px_#ff496e66]
              hover:bg-[#e03c5e]
              transition duration-300
              text-xs sm:text-sm md:text-base
              py-2 sm:py-2.5 md:py-3
            "
          >
            {isPending ? 'Generating...' : 'Generate QR code'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

