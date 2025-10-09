import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Transfer } from '@/modules/transfer/components';

export const metadata: Metadata = {
  title: 'Transfer',
};

export default function TransferPage() {
  return (
    <>
      <Toaster />
      <Transfer />
    </>
  );
}
