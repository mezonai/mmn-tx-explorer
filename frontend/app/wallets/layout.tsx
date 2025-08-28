import { MainLayout } from '@/components/layout';

export default function BlocksLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
