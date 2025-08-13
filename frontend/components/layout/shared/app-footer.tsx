import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

export function AppFooter() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center overflow-hidden rounded-md">
                <Image
                  src="/images/logo.png"
                  alt="MMN Explorer"
                  width={24}
                  height={24}
                />
              </div>
              <span className="text-sm font-medium">MMN Explorer</span>
            </div>
            <Separator orientation="vertical" className="hidden h-4 md:block" />
            <p className="text-muted-foreground text-sm">
              © 2025 MMN Explorer. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
