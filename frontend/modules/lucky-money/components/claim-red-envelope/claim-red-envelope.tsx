'use client';
import { useEffect } from "react"; 
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { useClaimRedEnvelopeContext } from "../../context/ClaimRedEnvelopeContext";

const RedEnvelopeIcon = () => (
  <svg
    width="100"
    height="120"
    viewBox="0 0 100 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="5" y="5" width="90" height="110" fill="black" />
    <rect x="10" y="10" width="80" height="100" fill="#DC2626" />
    <path d="M10 10 L50 45 L90 10 Z" fill="#B91C1C" />
    <circle cx="50" cy="50" r="10" fill="#FBBF24" />
  </svg>
);

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L9.19995 9.19995L2 12L9.19995 14.8L12 22L14.8 14.8L22 12L14.8 9.19995L12 2Z" />
  </svg>
);

const OpeningScreen = ({ isLoading }: { isLoading: boolean }) => (
  <div
    className="w-full bg-transparent border-none p-0 text-left"
  >
    <div className="w-full">
      <div className="border border-[rgb(246_199_68_/_0.5)] bg-[rgb(255_59_99_/_0.3)] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm shadow-lg w-full ">
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 md:space-y-6">
          <p className="text-[rgb(246_199_68)] text-sm sm:text-base md:text-lg tracking-wider">
            {'Open the Lucky money ...'}
          </p>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-yellow-600/20 rounded-full animate-pulse"></div>
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-500 z-10" />
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
  isError 
}: { 
  amount: number; 
  description?: string; 
  onClaim: () => void; 
  isLoading: boolean; 
  isError: boolean; 
}) => (
  <div className="flex flex-col items-center w-full text-center">
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold text-[rgb(246_199_68)] my-2 sm:my-3 md:my-4 break-words leading-tight">
      + {amount.toLocaleString('en-US')} đồng
    </h2>
    <p className="text-muted-foreground dark:text-gray-400 italic text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6 lg:mb-8 leading-relaxed">
      {description || "Wishing you a happy, healthy, and prosperous New Year!"}
    </p>
    <div className="flex flex-col w-full space-y-2 sm:space-y-3 md:space-y-4 pt-2 sm:pt-3 md:pt-4">
      <button 
        onClick={onClaim}
        disabled={isLoading || isError}
        className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 rounded-full shadow-lg transform transition-transform hover:scale-105 disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed text-xs sm:text-sm md:text-base">
        {isError ? "Claim Failed" : "Claim to Wallet"} 
      </button>

      <button className="w-full bg-transparent border-2 border-yellow-500 text-yellow-500 font-semibold py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 rounded-full flex items-center justify-center space-x-1.5 sm:space-x-2 transform transition-transform hover:scale-105 cursor-pointer text-xs sm:text-sm md:text-base">
        <span>Share your luck</span>
        <SparkleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
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
    isClaimError   
  } = useClaimRedEnvelopeContext();

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (status === 'idle') {
      timerId = setTimeout(() => {
        handleClaimAmount();
      }, 2500);
    }
    return () => { if (timerId) clearTimeout(timerId); };
  }, [status, handleClaimAmount]);

  useEffect(() => {
    if (isClaimError && claimError) {
      const errorMessage = (claimError as any)?.response?.data?.message 
        || claimError?.message 
        || "Claim failed. Please try again.";
      
      toast.error(errorMessage);
    }
  }, [isClaimError, claimError]);

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return <OpeningScreen isLoading={isLoading} />;
      case 'success':
        return claimMutationData?.amount 
          ? <RevealedScreen 
              onClaim={handleClaim} 
              isLoading={isLoading || isClaiming} 
              amount={claimMutationData.amount} 
              description={claimMutationData.description}
              isError={isClaimError} 
            /> 
          : <p className="text-foreground dark:text-white">Claim Successfully!</p>; 
      
      case 'error':
        const errorMessage = (error as any)?.response?.data?.message || error?.message || "Something went wrong.";
        return (
          <div className="flex flex-col items-center w-full max-w-md text-center pt-4 sm:pt-8 md:pt-16 px-2">
            <p className="text-red-600 dark:text-red-400 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={handleClaim}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 rounded-full shadow-lg transform transition-transform hover:scale-105 text-xs sm:text-sm md:text-base"
            >
              Retry
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-foreground dark:text-white font-sans bg-background px-3 sm:px-4">
      <header className="mb-4 sm:mb-6 md:mb-8">
        <div className='animate-bounce'>
          <RedEnvelopeIcon />
        </div>
      </header>

      <main className="flex flex-col items-center w-full max-w-sm text-center px-2 sm:px-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[rgb(246_199_68)] mb-2 sm:mb-3 leading-tight">
          {status === 'success' ? 'Congratulation!' : 'Lucky money is opening'}
        </h1>
        <p className="text-muted-foreground dark:text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6 lg:mb-10 leading-relaxed">
         {status === 'idle' && (
           <>
             You are about to receive a gift from {' '}
             <span className="font-bold text-foreground dark:text-white">
               Mezon Red Envelope
             </span>
           </>
         )}
          {status === 'success' && 'You have received a gift!'}
          {status === 'error' && 'Unable to open the red envelope...'}
        </p>
        
        <div className="relative w-full min-h-[250px] sm:min-h-[280px] md:min-h-[300px] lg:h-[350px]">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}