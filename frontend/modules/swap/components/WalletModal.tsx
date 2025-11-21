'use client';

import { MetaMaskIcon } from './MetaMaskIcon';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export const WalletModal = ({ isOpen, onClose, onConnect }: WalletModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Connect Wallet</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={onConnect}
            className="flex w-full items-center gap-3 rounded-lg border border-input bg-background p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <MetaMaskIcon />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">MetaMask</div>
              <div className="text-sm text-muted-foreground">Connect using browser wallet</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
