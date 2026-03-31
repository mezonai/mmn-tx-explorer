'use client';

import { useState } from 'react';
import { useUserPaymentInfos, useDeletePaymentInfo, useUpdatePaymentInfo } from '@/modules/p2p/hooks/usePaymentInfo';
import { Plus, Edit2, Trash2, Info, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BankPaymentAccountsModal } from './bank-payment-accounts-modal';
import { ConfirmDeleteBankModal } from './confirm-delete-bank-modal';
import { UserPaymentInfo } from '@/modules/p2p/types';
import { toast } from 'sonner';

export const BankPaymentAccountsTab = () => {
  const { data: payments, isLoading } = useUserPaymentInfos();
  const { mutate: deletePayment } = useDeletePaymentInfo();
  const { mutate: updatePayment } = useUpdatePaymentInfo();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<UserPaymentInfo | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<UserPaymentInfo | null>(null);

  const handleAdd = () => {
    setSelectedPayment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (payment: UserPaymentInfo) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (payment: UserPaymentInfo) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!paymentToDelete) return;
    deletePayment(paymentToDelete.id, {
      onSuccess: () => {
        toast.success('Account deleted');
        setIsDeleteModalOpen(false);
        setPaymentToDelete(null);
      },
      onError: () => toast.error('Failed to delete account'),
    });
  };

  const handleSetPrimary = (payment: UserPaymentInfo) => {
    updatePayment(
      { ...payment, is_primary: true },
      {
        onSuccess: () => toast.success('Primary account updated'),
        onError: () => toast.error('Failed to set primary account'),
      }
    );
  };

  return (
    <div className="w-full">
      <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border flex flex-col justify-between gap-4 border-b p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-foreground flex items-center gap-2 text-xl font-semibold">Bank Payment Accounts</h2>
            <p className="text-muted-foreground mt-1 text-sm">Manage your bank accounts for P2P trading</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-brand-primary hover:bg-brand-primary/90 w-full gap-2 text-white sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add New Bank Account
          </Button>
        </div>

        <div className="grid gap-4 p-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          ) : payments && payments.length > 0 ? (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="group border-border bg-background hover:border-brand-primary/50 relative flex flex-col overflow-hidden rounded-lg border p-4 shadow-sm transition-colors"
              >
                <div className="mb-3 flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-foreground text-sm font-bold">{payment.bank_name}</h3>
                    {payment.is_primary ? (
                      <span className="rounded border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800 dark:border-green-800 dark:bg-green-900/50 dark:text-green-300">
                        Primary
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetPrimary(payment)}
                        className="text-muted-foreground hover:text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/30 rounded border border-transparent px-2 py-0.5 text-[10px] font-medium transition-all"
                      >
                        Set as Primary
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(payment)}
                      className="text-muted-foreground hover:text-brand-primary hover:bg-muted h-8 w-8 rounded-full transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(payment)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-muted-foreground flex flex-row items-baseline gap-2 overflow-hidden text-sm">
                  <span className="text-foreground font-mono font-medium tracking-wide whitespace-nowrap">
                    **** {payment.account_number.slice(-4)}
                  </span>
                  <span className="text-muted-foreground/30 mx-1">|</span>
                  <span className="truncate text-xs font-medium uppercase sm:text-sm">{payment.account_name}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="border-border rounded-xl border-2 border-dashed py-12 text-center">
              <Landmark className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-20" />
              <p className="text-muted-foreground">No bank accounts added yet.</p>
            </div>
          )}
        </div>

        <div className="bg-muted/30 border-border border-t px-6 py-4">
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Info className="text-brand-primary h-4 w-4" />
            Only bank accounts with verified names matching your profile can be added for trading.
          </p>
        </div>
      </div>

      <BankPaymentAccountsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paymentInfo={selectedPayment}
      />
      <ConfirmDeleteBankModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        paymentInfo={paymentToDelete}
      />
    </div>
  );
};
