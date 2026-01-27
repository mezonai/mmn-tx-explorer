'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TokenSymbol } from '@/constant/token.constant';

interface EstimatedOutputProps {
  amount: string;
  tokenSymbol?: TokenSymbol;
}

const formatNumberWithCommas = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};

export const EstimatedOutput = ({ amount, tokenSymbol = TokenSymbol.WMezon }: EstimatedOutputProps) => {
  const calculateOutput = () => {
    if (!amount || isNaN(parseFloat(amount))) return '0.0000';

    const inputAmount = parseFloat(amount);
    return formatNumberWithCommas(inputAmount);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-muted-foreground text-sm md:text-base">You will receive</span>
          <span className="text-foreground font-mono text-lg font-semibold md:text-xl">
            {calculateOutput()} {tokenSymbol}
          </span>
        </div>
        <p className="text-muted-foreground mt-3 text-xs md:text-sm">
          After bridge confirmation (gas fee paid separately)
        </p>
      </CardContent>
    </Card>
  );
};
