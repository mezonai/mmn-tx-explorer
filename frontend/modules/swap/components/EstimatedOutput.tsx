'use client';

import { Card, CardContent } from '@/components/ui/card';

interface EstimatedOutputProps {
  amount: string;
  tokenSymbol?: string;
}

const formatNumberWithCommas = (value: number): string => {
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: 4,
    maximumFractionDigits: 4 
  });
};

export const EstimatedOutput = ({ 
  amount, 
  tokenSymbol = 'WMezon'
}: EstimatedOutputProps) => {
  const calculateOutput = () => {
    if (!amount || isNaN(parseFloat(amount))) return '0.0000';
    
    const inputAmount = parseFloat(amount);
    return formatNumberWithCommas(inputAmount);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
          <span className="text-sm md:text-base text-muted-foreground">You'll receive</span>
          <span className="text-foreground font-semibold font-mono text-lg md:text-xl">{calculateOutput()} {tokenSymbol}</span>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground mt-3">After bridge confirmation (gas fee paid separately)</p>
      </CardContent>
    </Card>
  );
};
