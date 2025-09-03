import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { YEAR_FORMAT } from '@/constant';
import { cn } from '@/lib/utils';

export function AppFooter() {
  return (
    <footer className="bg-muted">
      <div className="container mx-auto flex flex-col items-center justify-between gap-y-12 px-4 py-6 md:px-8 lg:gap-y-4">
        <div
          className={cn(
            'flex flex-col items-center gap-x-8 gap-y-3 lg:flex-row',
            '[&>*]:text-tertiary-600 [&>*]:size-fit [&>*]:p-0 [&>*]:text-base [&>*]:font-semibold'
          )}
        >
          <Button variant="link" asChild>
            <Link href="#">Privacy Policy</Link>
          </Button>
          <Button variant="link" asChild>
            <Link href="#">Terms of Service</Link>
          </Button>
          <Button variant="link" asChild>
            <Link href="#">Contact</Link>
          </Button>
        </div>

        <p className="text-quaternary-500 text-base font-normal">
          © {format(Date.now(), YEAR_FORMAT)} MMN Explorer. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
