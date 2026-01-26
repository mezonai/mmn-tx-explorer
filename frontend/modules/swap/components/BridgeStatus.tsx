'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock } from 'lucide-react';
import { BSC_SCAN_URL } from '@/constant/contracts';
import { CopyButton } from '@/components/ui/copy-button';

export enum BridgeStep {
  Idle = 'idle',
  Approving = 'approving',
  Confirmed = 'confirmed',
  Processing = 'processing',
  Completed = 'completed',
}

export enum BridgeStatusType {
  Idle = 'idle',
  Active = 'active',
  Completed = 'completed',
}

interface BridgeStatusProps {
  currentStep?: BridgeStep;
  txHash?: string;
  show?: boolean;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
}

export const BridgeStatus = ({
  currentStep = BridgeStep.Idle,
  txHash,
  show = false,
  isPending = false,
  isConfirming = false,
  isConfirmed = false,
}: BridgeStatusProps) => {
  if (!show) return null;

  let activeStep: BridgeStep = BridgeStep.Idle;
  if (isPending) activeStep = BridgeStep.Approving;
  else if (isConfirming) activeStep = BridgeStep.Confirmed;
  else if (isConfirmed && currentStep === BridgeStep.Processing) activeStep = BridgeStep.Processing;
  else if (isConfirmed) activeStep = BridgeStep.Completed;

  const steps = [
    {
      id: BridgeStep.Approving,
      label: 'Waiting for wallet approval',
      description: 'Please confirm the transaction in MetaMask',
    },
    {
      id: BridgeStep.Confirmed,
      label: 'Transaction submitted',
      description: 'Confirming on Binance Smart Chain...',
    },
    {
      id: BridgeStep.Processing,
      label: 'Processing bridge',
      description: 'Transferring tokens between networks',
    },
    {
      id: BridgeStep.Completed,
      label: 'Bridge completed',
      description: 'Your tokens have been successfully transferred',
    },
  ];

  const getStepStatus = (stepId: BridgeStep) => {
    const stepOrder: BridgeStep[] = [
      BridgeStep.Approving,
      BridgeStep.Confirmed,
      BridgeStep.Processing,
      BridgeStep.Completed,
    ];
    const currentIndex = stepOrder.indexOf(activeStep);
    const stepIndex = stepOrder.indexOf(stepId);
    if (activeStep === BridgeStep.Completed) return BridgeStatusType.Completed;
    if (stepIndex < currentIndex) return BridgeStatusType.Completed;
    if (stepIndex === currentIndex) return BridgeStatusType.Active;
    return BridgeStatusType.Idle;
  };

  return (
    <Card className="border-brand-primary/20 mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Bridge Status</CardTitle>
        {txHash && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-muted-foreground font-mono text-xs break-all">
              <a
                href={`${BSC_SCAN_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:text-brand-primary/80"
              >
                {txHash}
              </a>
            </p>
            <CopyButton textToCopy={txHash} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            return (
              <li key={step.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <div
                    className={`rounded-full p-1 ${
                      status === BridgeStatusType.Completed
                        ? 'bg-green-500/10'
                        : status === BridgeStatusType.Active
                          ? 'bg-brand-primary/10'
                          : 'bg-muted'
                    }`}
                  >
                    {status === BridgeStatusType.Completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : status === BridgeStatusType.Active ? (
                      <Clock className="text-brand-primary h-4 w-4" />
                    ) : (
                      <Clock className="text-muted-foreground/40 h-4 w-4" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      status === BridgeStatusType.Completed
                        ? 'text-green-600 dark:text-green-400'
                        : status === BridgeStatusType.Active
                          ? 'text-foreground'
                          : 'text-muted-foreground/40'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`mt-0.5 text-xs ${
                      status === BridgeStatusType.Active ? 'text-muted-foreground' : 'text-muted-foreground/40'
                    }`}
                  >
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
