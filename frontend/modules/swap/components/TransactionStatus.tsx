interface TransactionStatusProps {
  hash?: string;
  isConfirmed: boolean;
}

export const TransactionStatus = ({ hash, isConfirmed }: TransactionStatusProps) => {
  return (
    <>
      {hash && (
        <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Transaction Hash:
          </p>
          <p className="break-all font-mono text-xs">{hash}</p>
        </div>
      )}

      {isConfirmed && (
        <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Transaction Confirmed! ✅
          </p>
        </div>
      )}
    </>
  );
};
