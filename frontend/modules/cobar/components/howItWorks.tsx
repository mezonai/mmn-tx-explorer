import Card from './shared/card';
import { CreditCardRefresh } from '@/assets/icons';
import { ShieldCheckIcon, RotateCcw } from 'lucide-react';
import { APP_CONFIG } from '@/configs/app.config';

export const HowItWorks = () => {
  return (
    <>
      <h2 className="text-xl font-bold">How it works</h2>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
        <Card
          title={`Pay with Mezon ${APP_CONFIG.CHAIN_SYMBOL}`}
          description="Checkout with your wallet or scan a QR in the Mezon app."
          icon={<CreditCardRefresh className='text-brand-primary' />}
        />
        <Card
          title="Secure & Transparent"
          description="On-chain receipts, plus status tracking from your account detail page."
          icon={<ShieldCheckIcon className='text-brand-primary'  />}
        />
        <Card
          title="Refund-friendly"
          description="Orders can be refunded to Wallet or flat per store policy"
          icon={<RotateCcw className='text-brand-primary'  />}
        />
      </div>
    </>
  );
};
