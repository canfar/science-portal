import type { Metadata } from 'next';
import { ThemeProvider } from '@/app/theme/ThemeContext';
import { SkipNavigation } from '@/app/components/SkipNavigation/SkipNavigation';
import { ClientErrorBoundary } from '@/app/components/ClientErrorBoundary';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { NuqsProvider } from '@/lib/providers/NuqsProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'CANFAR - Canadian Advanced Network for Astronomical Research',
  description: 'Empowering astronomical research through advanced computing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <NuqsProvider>
            <AuthProvider>
              <ThemeProvider>
                <ClientErrorBoundary>
                  <SkipNavigation />
                  {children}
                </ClientErrorBoundary>
              </ThemeProvider>
            </AuthProvider>
          </NuqsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
