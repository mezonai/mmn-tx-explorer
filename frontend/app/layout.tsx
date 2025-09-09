import type { Metadata } from 'next';
import { Geist, Geist_Mono, Manrope } from 'next/font/google';
import { Suspense } from 'react';

import './globals.css';
import { ErrorBoundary } from '@/components/shared';
import Providers from '@/providers/QueryClientProvider';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | MMN Explorer',
    default: 'MMN Explorer',
  },
  description: 'Mezon Mainnet Transaction Explorer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Providers>{children}</Providers>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
