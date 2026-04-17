import type { Metadata } from 'next';
import { ThemeProvider } from '@/app/theme/ThemeContext';
import { SkipNavigation } from '@/app/components/SkipNavigation/SkipNavigation';
import { ClientErrorBoundary } from '@/app/components/ClientErrorBoundary';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { NuqsProvider } from '@/lib/providers/NuqsProvider';
import { PublicRuntimeConfigProvider } from '@/lib/providers/PublicRuntimeConfigProvider';
import { getPublicRuntimeConfigFromEnv } from '@/lib/config/public-runtime-config';
import './globals.css';

/** Re-read deployment env on every request so container runtime vars reach the client. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CANFAR - Canadian Advanced Network for Astronomical Research',
  description: 'Empowering astronomical research through advanced computing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicRuntimeConfig = getPublicRuntimeConfigFromEnv();

  return (
    <html lang="en">
      <body>
        <PublicRuntimeConfigProvider value={publicRuntimeConfig}>
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
        </PublicRuntimeConfigProvider>
      </body>
    </html>
  );
}
