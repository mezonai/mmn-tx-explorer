import { GeneralSearch } from '../shared/general-search';
import { MainLayout } from './main-layout';

export function WithSearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <div className="space-y-4">
        <GeneralSearch />
        <div>{children}</div>
      </div>
    </MainLayout>
  );
}
