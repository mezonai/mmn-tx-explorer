import { WithSearchLayout } from '@/components/layout/with-search-layout';

export default function BlocksLayout({ children }: { children: React.ReactNode }) {
  return <WithSearchLayout>{children}</WithSearchLayout>;
}
