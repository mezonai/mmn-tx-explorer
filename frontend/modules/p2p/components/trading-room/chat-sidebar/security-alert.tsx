import { AlertTriangle, Info } from 'lucide-react';

export const SecurityAlert = () => (
  <div className="mb-6 px-1">
    <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-500">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-[11px] font-bold tracking-wider uppercase">Security Awareness</span>
      </div>

      <div className="space-y-3 text-[12px] leading-relaxed">
        <p className="text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-amber-700 dark:text-amber-400">Important:</span> Support will{' '}
          <span className="italic underline">never</span> ask for your wallet password or private keys. Never disclose
          your credentials to anyone.
        </p>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-black/40">
          <div className="mb-1 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Info className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase">Chat Guidance</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-500">
            To access your permanent chat logs and transaction history, please refer to{' '}
            <span className="font-medium text-amber-600 dark:text-amber-500/80">Mezon</span>.
          </p>
        </div>
      </div>
    </div>
  </div>
);
