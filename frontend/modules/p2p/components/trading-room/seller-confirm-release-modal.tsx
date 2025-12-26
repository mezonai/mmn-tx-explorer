'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { APP_CONFIG } from '@/configs/app.config';
import { formatCurrency } from '@/modules/p2p/util';

interface SellerConfirmReleaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amountToRelease: number;
    amountReceived: number;
    onConfirm: () => void;
    isLoading?: boolean;
}


export const SellerConfirmReleaseModal = ({
    open,
    onOpenChange,
    amountToRelease,
    amountReceived,
    onConfirm,
    isLoading = false,
}: SellerConfirmReleaseModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="text-brand-primary pb-2 text-left text-lg font-semibold">
                        Confirm Money Received & Release {APP_CONFIG.CHAIN_SYMBOL}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                    <AlertTriangle className="text-amber-600 dark:text-amber-500 mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                        <span className="font-semibold">Important:</span> Only confirm if you have received full payment. Once confirmed, the {APP_CONFIG.CHAIN_SYMBOL} will be released and the action cannot be undone.
                    </p>
                </div>

                <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <span className="text-xs text-muted-foreground">Amount to Release</span>
                        <span className="text-lg font-bold text-foreground">
                            {formatCurrency(amountToRelease)} <span className="text-sm text-muted-foreground">{APP_CONFIG.CHAIN_SYMBOL}</span>
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <span className="text-xs text-muted-foreground">Amount You Received</span>
                        <span className="text-lg font-bold text-green-400">
                            {formatCurrency(amountReceived)} <span className="text-sm">VND</span>
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex flex-col space-y-4">
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-brand-primary shadow-primary/10 hover:bg-primary-light mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...
                            </>
                        ) : (
                            `Confirm & Release ${APP_CONFIG.CHAIN_SYMBOL}`
                        )}
                    </Button>

                    <Button
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full rounded-xl text-center text-xs transition disabled:opacity-50"
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
