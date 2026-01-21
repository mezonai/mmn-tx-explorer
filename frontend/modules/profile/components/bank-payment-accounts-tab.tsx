'use client';

import { useState } from 'react';
import { useUserPaymentInfos, useDeletePaymentInfo, useUpdatePaymentInfo } from '@/modules/p2p/hooks/usePaymentInfo';
import { Plus, Edit2, Trash2, Info, Landmark, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BankPaymentAccountsModal } from './bank-payment-accounts-modal';
import { UserPaymentInfo } from '@/modules/p2p/types';
import { toast } from 'sonner';

export const BankPaymentAccountsTab = () => {
    const { data: payments, isLoading } = useUserPaymentInfos();
    const { mutate: deletePayment } = useDeletePaymentInfo();
    const { mutate: updatePayment } = useUpdatePaymentInfo();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<UserPaymentInfo | null>(null);

    const handleAdd = () => {
        setSelectedPayment(null);
        setIsModalOpen(true);
    };

    const handleEdit = (payment: UserPaymentInfo) => {
        setSelectedPayment(payment);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this bank account?')) {
            deletePayment(id, {
                onSuccess: () => toast.success('Account deleted'),
                onError: () => toast.error('Failed to delete account')
            });
        }
    };

    const handleSetPrimary = (payment: UserPaymentInfo) => {
        updatePayment({ ...payment, is_primary: true }, {
            onSuccess: () => toast.success('Primary account updated'),
            onError: () => toast.error('Failed to set primary account')
        });
    };

    return (
        <div className="w-full">
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            Bank Payment Accounts
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage your bank accounts for P2P trading
                        </p>
                    </div>
                    <Button
                        onClick={handleAdd}
                        className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Bank Account
                    </Button>
                </div>

                <div className="p-6 grid gap-4">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-lg" />
                        ))
                    ) : payments && payments.length > 0 ? (
                        payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="group flex flex-col p-4 rounded-lg border border-border bg-background hover:border-brand-primary/50 transition-colors shadow-sm relative overflow-hidden"
                            >
                                <div className="flex justify-between items-center w-full mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-foreground">
                                            {payment.bank_name}
                                        </h3>
                                        {payment.is_primary ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                Primary
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetPrimary(payment)}
                                                className="px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground hover:text-brand-primary hover:bg-brand-primary/10 border border-transparent hover:border-brand-primary/30 transition-all"
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
                                            className="h-8 w-8 text-muted-foreground hover:text-brand-primary hover:bg-muted rounded-full transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(payment.id)}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-row items-baseline gap-2 text-sm text-muted-foreground overflow-hidden">
                                    <span className="font-mono tracking-wide font-medium text-foreground whitespace-nowrap">
                                        **** {payment.account_number.slice(-4)}
                                    </span>
                                    <span className="mx-1 text-muted-foreground/30">|</span>
                                    <span className="uppercase truncate font-medium text-xs sm:text-sm">
                                        {payment.account_name}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                            <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No bank accounts added yet.</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-muted/30 border-t border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Info className="w-4 h-4 text-brand-primary" />
                        Only bank accounts with verified names matching your profile can be added for trading.
                    </p>
                </div>
            </div>

            <BankPaymentAccountsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                paymentInfo={selectedPayment}
            />
        </div>
    );
};
