'use client';
import { useEffect } from 'react';
import { Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useClaimRedEnvelopeContext } from '../../context/ClaimRedEnvelopeContext';

const RedEnvelopeIcon = () => (
  <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="90" height="110" fill="black" />
    <rect x="10" y="10" width="80" height="100" fill="#DC2626" />
    <path d="M10 10 L50 45 L90 10 Z" fill="#B91C1C" />
    <circle cx="50" cy="50" r="10" fill="#FBBF24" />
  </svg>
);

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L9.19995 9.19995L2 12L9.19995 14.8L12 22L14.8 14.8L22 12L14.8 9.19995L12 2Z" />
  </svg>
);

const OpeningScreen = ({ isLoading }: { isLoading: boolean }) => (
  <div className="w-full border-none bg-transparent p-0 text-left">
    <div className="w-full">
      <div className="w-full rounded-xl border border-[rgb(246_199_68_/_0.5)] bg-[rgb(255_59_99_/_0.3)] p-4 shadow-lg backdrop-blur-sm sm:rounded-2xl sm:p-6 md:p-8">
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 md:space-y-6">
          <p className="text-sm tracking-wider text-[rgb(246_199_68)] sm:text-base md:text-lg">
            {'Open the Lucky money ...'}
          </p>
          <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24 md:h-32 md:w-32">
            <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-600/20"></div>
            <Gift className="z-10 h-4 w-4 text-yellow-500 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RevealedScreen = ({
  amount,
  description,
  onClaim,
  isLoading,
  isError,
  isSuccess,
}: {
  amount: number;
  description?: string;
  onClaim: () => void;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}) => (
  <div className="flex w-full flex-col items-center text-center">
    <h2 className="my-2 text-xl leading-tight font-bold break-words text-[rgb(246_199_68)] sm:my-3 sm:text-2xl md:my-4 md:text-3xl lg:text-5xl">
      + {amount.toLocaleString('en-US')} đồng
    </h2>
    <p className="text-muted-foreground mb-3 text-xs leading-relaxed italic sm:mb-4 sm:text-sm md:mb-6 md:text-base lg:mb-8 lg:text-lg dark:text-gray-400">
      {description || 'Wishing you a happy, healthy, and prosperous New Year!'}
    </p>
    <div className="flex w-full flex-col space-y-2 pt-2 sm:space-y-3 sm:pt-3 md:space-y-4 md:pt-4">
      <button
        onClick={onClaim}
        disabled={isLoading || isError || isSuccess}
        className="w-full transform cursor-pointer rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2.5 sm:text-sm md:px-6 md:py-3 md:text-base"
      >
        {isSuccess ? 'Claimed Successfully' : isError ? 'Claim Failed' : 'Claim to Wallet'}
      </button>

      {/* <button className="flex w-full transform cursor-pointer items-center justify-center space-x-1.5 rounded-full border-2 border-yellow-500 bg-transparent px-3 py-2 text-xs font-semibold text-yellow-500 transition-transform hover:scale-105 sm:space-x-2 sm:px-4 sm:py-2.5 sm:text-sm md:px-6 md:py-3 md:text-base">
        <span>Share your luck</span>
        <SparkleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button> */}
    </div>
  </div>
);

export const ClaimRedEnvelope = () => {
  const {
    status,
    claimMutationData,
    error,
    handleClaim,
    handleClaimAmount,
    isLoading,
    isClaiming,
    claimError,
    isClaimError,
    isClaimSuccess,
  } = useClaimRedEnvelopeContext();

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (status === 'idle') {
      timerId = setTimeout(() => {
        handleClaimAmount();
      }, 2500);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [status, handleClaimAmount]);

  useEffect(() => {
    if (isClaimError && claimError) {
      const errorMessage =
        (claimError as any)?.response?.data?.message || claimError?.message || 'Claim failed. Please try again.';

      toast.error(errorMessage);
    }
  }, [isClaimError, claimError]);

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return <OpeningScreen isLoading={isLoading} />;
      case 'success':
        return claimMutationData?.amount ? (
          <RevealedScreen
            onClaim={handleClaim}
            isLoading={isLoading || isClaiming}
            amount={claimMutationData.amount}
            description={claimMutationData.description}
            isError={isClaimError}
            isSuccess={isClaimSuccess}
          />
        ) : (
          <p className="text-foreground dark:text-white">Claim Successfully!</p>
        );
      case 'error':
        const errorMessage = (error as any)?.response?.data?.message || error?.message || 'Something went wrong.';
        return (
          <div className="flex w-full max-w-md flex-col items-center px-2 pt-4 text-center sm:pt-8">
            <p className="text-lg font-bold break-words text-[rgb(246_199_68)] first-letter:uppercase sm:text-xl md:text-2xl dark:text-[rgb(246_199_68)]">
              {errorMessage}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (status === 'success') return 'Congratulation!';
    if (status === 'error') return '';
    return 'Lucky money is opening';
  };

  return (
    <div className="text-foreground bg-background flex min-h-screen flex-col items-center justify-center px-3 font-sans sm:px-4 dark:text-white">
      <header className="mb-4 sm:mb-6 md:mb-8">
        <div className="animate-bounce">
          <RedEnvelopeIcon />
        </div>
      </header>

      <main className="flex w-full max-w-sm flex-col items-center px-2 text-center sm:px-4">
        <h1 className="mb-2 text-lg leading-tight font-bold text-[rgb(246_199_68)] sm:mb-3 sm:text-xl md:text-2xl lg:text-3xl">
          {getTitle()}
        </h1>
        {status !== 'error' && (
          <p className="text-muted-foreground mb-3 text-xs sm:mb-4 sm:text-sm md:mb-6 md:text-base lg:mb-10 lg:text-lg dark:text-gray-300">
            {status === 'idle' && (
              <>
                You are about to receive a gift from{' '}
                <span className="text-foreground font-bold dark:text-white">Mezon Red Envelope</span>
              </>
            )}
            {status === 'success' &&
              'You have received a gift! Please click the "Claim to Wallet" button to receive the funds.'}
          </p>
        )}

        <div className="relative min-h-[250px] w-full sm:min-h-[280px] md:min-h-[300px] lg:h-[350px]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
