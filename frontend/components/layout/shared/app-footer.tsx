import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { YEAR_FORMAT } from '@/constant';

export function AppFooter() {
  return (
    <footer className="bg-muted">
      <div className="container mx-auto flex flex-col items-center justify-between gap-y-12 px-4 py-6 md:px-8 lg:gap-y-4">
        <div className="flex flex-col items-center gap-x-8 gap-y-3 lg:flex-row">
          <Button variant="link" className="text-foreground text-base font-semibold" asChild>
            <Link href="#">Privacy Policy</Link>
          </Button>
          <Button variant="link" className="text-foreground text-base font-semibold" asChild>
            <Link href="#">Terms of Service</Link>
          </Button>
          <Button variant="link" className="text-foreground text-base font-semibold" asChild>
            <Link href="#">Contact</Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-base font-[400]">
          © {format(Date.now(), YEAR_FORMAT)} MMN Explorer. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
