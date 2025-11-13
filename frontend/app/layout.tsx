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

export const metadata: Metadata = {
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
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
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
