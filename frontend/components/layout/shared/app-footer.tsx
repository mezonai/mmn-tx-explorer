import Link from 'next/link';

import Image from 'next/image';

export function AppFooter() {
  return (
    <footer className="bg-card border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between dark:text-gray-400">
          <div className="flex items-center gap-3">
            <div className="flex aspect-square size-9 items-center justify-center overflow-hidden rounded-lg">
              <Image src="/images/logo.webp" alt="Mezon Đồng Logo" width={36} height={36} />
            </div>
            <span>Mezon Đồng - Public Overview</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-primary transition dark:hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary transition dark:hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-primary transition dark:hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
