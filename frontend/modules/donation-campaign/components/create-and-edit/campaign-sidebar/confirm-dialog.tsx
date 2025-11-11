'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type ConfirmVariant = 'delete' | 'publish' | 'close';

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

const variantConfig = {
  delete: {
    icon: AlertTriangle,
    iconBgClass: 'bg-red-600',
    iconClass: 'text-white',
    buttonClass: 'bg-red-600 hover:bg-red-600/70 text-white',
  },
  publish: {
    icon: CheckCircle,
    iconBgClass: 'bg-brand-primary',
    iconClass: 'text-white',
    buttonClass: 'bg-brand-primary hover:bg-brand-primary/90 text-white',
  },
  close: {
    icon: XCircle,
    iconBgClass: 'bg-background border border-rose-400',
    iconClass: 'text-rose-600 dark:text-rose-300',
    buttonClass: 'bg-rose-600 hover:bg-rose-600/90 text-white dark:bg-rose-700 dark:hover:bg-rose-700/90',
  },
};

export function ConfirmDialog({
  trigger,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'publish',
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.iconBgClass}`}>
                <Icon className={`h-5 w-5 ${config.iconClass}`} />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-left">{title}</DialogTitle>
              {description && <DialogDescription className="text-left">{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
            {cancelText}
          </Button>
          <Button type="button" onClick={handleConfirm} className={`w-full sm:w-auto ${config.buttonClass}`}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
