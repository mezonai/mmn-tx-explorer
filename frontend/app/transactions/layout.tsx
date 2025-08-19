import { WithSearchLayout } from '@/components/layout/with-search-layout';

export default function TransactionsLayout({ children }: { children: React.ReactNode }) {
  return <WithSearchLayout>{children}</WithSearchLayout>;
}
