import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';

import './globals.css';
import { ErrorBoundary } from '@/components/shared';
import { AppProvider } from '@/providers/AppProvider';
import Providers from '@/providers/QueryClientProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

function getMetadataBase(): URL | undefined {
  let raw = process.env.NEXT_PUBLIC_CHAT_APP_MMN_API_URL;
  if (!raw) return undefined;
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = `https://${raw}`;
  }
  try {
    const origin = new URL(raw).origin;
    return new URL(origin);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    template: '%s | Mezon Đồng',
    default: 'Mezon Đồng',
  },
  description: 'Mezon Mainnet Transaction Explorer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider defaultTheme="dark">
          <ErrorBoundary>
            <Suspense fallback={null}>
              <AppProvider>
                <Providers>{children}</Providers>
              </AppProvider>
            </Suspense>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
