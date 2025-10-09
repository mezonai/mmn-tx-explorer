import { MainLayout } from '@/components/layout';

export default function SwapLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
