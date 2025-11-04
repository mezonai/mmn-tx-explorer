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
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  trigger: React.ReactNode;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmDialog({
  trigger,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);

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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
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
          <Button type="button" variant="destructive" onClick={handleConfirm} className="w-full sm:w-auto">
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
