'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

interface ConnectWalletButtonProps {
  onConnectClick: () => void;
}

export const ConnectWalletButton = ({ onConnectClick }: ConnectWalletButtonProps) => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={onConnectClick}
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                  >
                    Choose network
                  </button>
                );
              }

              return (
                <div className="flex gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
                  >
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm hover:bg-accent"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
