'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, Loader2, ExternalLink } from 'lucide-react';
import { BSC_SCAN_URL } from '@/constant/contracts';

type BridgeStep = 'idle' | 'approving' | 'confirmed' | 'processing' | 'completed';

interface BridgeStatusProps {
  currentStep?: BridgeStep;
  txHash?: string;
  show?: boolean;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
}

export const BridgeStatus = ({ 
  currentStep = 'idle',
  txHash,
  show = false,
  isPending = false,
  isConfirming = false,
  isConfirmed = false,
}: BridgeStatusProps) => {
  if (!show) return null;

  let activeStep: BridgeStep = 'idle';
  if (isPending) activeStep = 'approving';
  else if (isConfirming) activeStep = 'confirmed';
  else if (isConfirmed && currentStep === 'processing') activeStep = 'processing';
  else if (isConfirmed) activeStep = 'completed';

  const steps = [
    {
      id: 'approving',
      label: 'Waiting for wallet approval',
      description: 'Please confirm the transaction in MetaMask',
    },
    {
      id: 'confirmed',
      label: 'Transaction submitted',
      description: 'Confirming on Binance Smart Chain...',
    },
    {
      id: 'processing',
      label: 'Processing bridge',
      description: 'Transferring tokens between networks',
    },
    {
      id: 'completed',
      label: 'Bridge completed',
      description: 'Your tokens have been successfully transferred',
    },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['approving', 'confirmed', 'processing', 'completed'];
    const currentIndex = stepOrder.indexOf(activeStep);
    const stepIndex = stepOrder.indexOf(stepId);
    if (activeStep === 'completed') return 'completed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <Card className="mt-6 border-brand-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">
          Bridge Status
        </CardTitle>
        {txHash && (
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-muted-foreground font-mono break-all">
              TX: {txHash}
            </p>
            <a
              href={`${BSC_SCAN_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:text-brand-primary/80 flex-shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            return (
              <li
                key={step.id}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`rounded-full p-1 ${
                    status === 'completed'
                      ? 'bg-green-500/10'
                      : status === 'active'
                      ? 'bg-brand-primary/10'
                      : 'bg-muted'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : status === 'active' ? (
                      <Clock className="h-4 w-4 text-brand-primary" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    status === 'completed'
                      ? 'text-green-600 dark:text-green-400'
                      : status === 'active'
                      ? 'text-foreground'
                      : 'text-muted-foreground/40'
                  }`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    status === 'active'
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/40'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};
