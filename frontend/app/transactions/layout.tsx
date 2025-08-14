import { MainLayout } from '@/components/layout';

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
