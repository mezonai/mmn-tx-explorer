'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPaymentInfo } from '@/modules/p2p/types';

interface ConfirmDeleteBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    paymentInfo: UserPaymentInfo | null;
}

export const ConfirmDeleteBankModal = ({ isOpen, onClose, onConfirm, paymentInfo }: ConfirmDeleteBankModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Confirm Deletion</DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        Are you sure you want to delete this bank account? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {paymentInfo && (
                    <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3 mt-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Bank Name</span>
                            <span className="text-foreground font-semibold">{paymentInfo.bank_name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Account Number</span>
                            <span className="text-foreground font-mono">{paymentInfo.account_number}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Account Name</span>
                            <span className="text-foreground font-medium uppercase">{paymentInfo.account_name}</span>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex sm:justify-end gap-3 mt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-muted-foreground hover:bg-transparent"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                        Delete Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
