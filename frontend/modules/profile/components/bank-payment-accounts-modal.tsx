'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, User, Info, Loader2 } from 'lucide-react';
import { BankOption, UserPaymentInfo } from '@/modules/p2p/types';
import { useUpdatePaymentInfo, useUserPaymentInfos } from '@/modules/p2p/hooks/usePaymentInfo';
import { useUser } from '@/providers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BankPaymentAccountsModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentInfo?: UserPaymentInfo | null;
}

const bankOptions: { value: BankOption; label: string }[] = [
    { value: 'MB', label: 'MB Bank' },
    { value: 'VCB', label: 'Vietcombank' },
    { value: 'TCB', label: 'Techcombank' },
    { value: 'ACB', label: 'ACB' },
    { value: 'TPBANK', label: 'TPBank' },
    { value: 'VIETCOMBANK', label: 'Vietcombank' },
];

export const BankPaymentAccountsModal = ({ isOpen, onClose, paymentInfo }: BankPaymentAccountsModalProps) => {
    const { user } = useUser();
    const { data: savedPayments } = useUserPaymentInfos();
    const { mutate: updatePayment, isPending } = useUpdatePaymentInfo();

    const [bank, setBank] = useState<BankOption>('MB');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);

    useEffect(() => {
        if (paymentInfo) {
            const bankOpt = bankOptions.find((opt) => opt.label === paymentInfo.bank_name);
            if (bankOpt) setBank(bankOpt.value);
            setAccountNumber(paymentInfo.account_number);
            setAccountName(paymentInfo.account_name);
            setIsPrimary(paymentInfo.is_primary);
        } else {
            setBank('MB');
            setAccountNumber('');
            setAccountName('');
            setIsPrimary(false);
        }
    }, [paymentInfo, isOpen]);

    const handleBankChange = (value: BankOption) => {
        setBank(value);
        if (!paymentInfo && savedPayments) {
            const bankLabel = bankOptions.find((opt) => opt.value === value)?.label;
            const matched = savedPayments.find((p) => p.bank_name === bankLabel);
            if (matched) {
                setAccountNumber(matched.account_number);
                setIsPrimary(matched.is_primary);
            } else {
                setAccountNumber('');
                setIsPrimary(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountNumber) {
            toast.error('Please enter account number');
            return;
        }

        const bankLabel = bankOptions.find((b) => b.value === bank)?.label || bank;

        updatePayment({
            id: paymentInfo?.id,
            bank_name: bankLabel,
            account_number: accountNumber,
            account_name: accountName,
            is_primary: isPrimary
        }, {
            onSuccess: () => {
                toast.success(paymentInfo ? 'Account updated' : 'Account added');
                onClose();
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Failed to save account');
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-lg font-semibold text-foreground">
                        {paymentInfo ? 'Edit Bank Account' : 'Add New Bank Account'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
                    {/* Bank Name - Reuse PaymentSection style */}
                    <div>
                        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Bank Name</label>
                        <Select onValueChange={(v) => handleBankChange(v as BankOption)} value={bank}>
                            <SelectTrigger className="border-border bg-input text-foreground w-full cursor-pointer rounded-md border px-3 py-2.5 text-sm focus:outline-none">
                                <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                                {bankOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Account Number - Reuse PaymentSection style */}
                    <div>
                        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Account Number</label>
                        <div className="relative">
                            <Input
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                type="text"
                                placeholder="Enter account number"
                                maxLength={20}
                                className="bg-input/30 text-foreground w-full rounded-md border border-border px-3 py-2.5 text-sm focus:outline-none"
                            />
                            <div className="text-muted-foreground absolute top-3.5 right-3">
                                <CreditCard className="text-muted-foreground h-3 w-3" />
                            </div>
                        </div>
                    </div>

                    {/* Account Name - Reuse PaymentSection style */}
                    <div>
                        <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Account Name</label>
                        <div className="relative">
                            <Input
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                type="text"
                                placeholder="Enter account owner name"
                                className="bg-input/30 text-foreground w-full rounded-md border border-border px-3 py-2.5 text-sm focus:outline-none"
                            />
                            <div className="text-muted-foreground absolute top-3.5 right-3">
                                <User className="text-muted-foreground h-3 w-3" />
                            </div>
                        </div>
                    </div>

                    {/* Primary Switch */}
                    <div className="flex items-center justify-between pt-1">
                        <label className="text-sm font-medium text-foreground cursor-pointer select-none" htmlFor="set-primary">
                            Set as primary bank account
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="set-primary"
                                className="sr-only peer"
                                checked={isPrimary}
                                onChange={(e) => setIsPrimary(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary/50 rounded-full peer dark:bg-muted/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-border peer-checked:bg-brand-primary"></div>
                        </label>
                    </div>

                    {/* Note Box - Reuse PaymentSection style */}
                    <div className="border-brand-primary bg-card mt-2 rounded border p-3">
                        <p className="flex items-start gap-2 text-xs leading-relaxed">
                            <Info className="text-brand-primary mt-0.5 h-3 w-3 shrink-0" />
                            <span className="text-muted-foreground">
                                Note: Please ensure the Account Name entered matches exactly the bank account holder&apos;s name.
                            </span>
                        </p>
                    </div>
                </form>

                <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border sm:flex-row-reverse gap-3">
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white font-bold h-10 px-6 rounded-md shadow-sm"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {paymentInfo ? 'Save Changes' : 'Add Account'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full sm:w-auto h-10 px-6 text-muted-foreground hover:bg-transparent"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
