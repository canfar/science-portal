'use client';

/**
 * Science Portal Page - Refactored with New State Management
 *
 * This is an example migration showing how to use:
 * - TanStack Query for remote state (sessions, platform load)
 * - nuqs for URL state (filters, modals, etc.)
 * - Zustand for shared client state (UI preferences, notifications)
 */

import { AppBar } from '@/app/components/AppBar/AppBar';
import { ActiveSessionsWidget } from '@/app/components/ActiveSessionsWidget/ActiveSessionsWidget';
import { UserStorageWidget } from '@/app/components/UserStorageWidget/UserStorageWidget';
import { LaunchFormWidget } from '@/app/components/LaunchFormWidget/LaunchFormWidget';
import { PlatformLoad } from '@/app/components/PlatformLoad/PlatformLoad';
import { Footer } from '@/app/components/Footer/Footer';
import { Box } from '@/app/components/Box/Box';
import { Container } from '@mui/material';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { appBarWithUserMenu, CanfarLogo } from '@/stories/shared/navigation';

// Import new state management hooks
import { useSessions } from '@/lib/hooks/useSessions';
import { usePlatformLoad } from '@/lib/hooks/usePlatformLoad';
import { useSearchQuery, useLaunchModal } from '@/lib/hooks/useUrlState';
import { useUIStore } from '@/lib/stores/useUIStore';
import { useEffect } from 'react';

export default function SciencePortalPage() {
  // TanStack Query: Remote state with automatic refetching
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useSessions();

  const {
    data: platformLoadData,
    isLoading: isLoadingPlatform,
    refetch: refetchPlatform,
  } = usePlatformLoad();

  // nuqs: URL state for search and modals (shareable URLs!)
  const [searchQuery] = useSearchQuery();
  const [showLaunchModal, setShowLaunchModal] = useLaunchModal();

  // Zustand: Client-side UI state
  const addNotification = useUIStore((state) => state.addNotification);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  // Filter sessions based on URL search query
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    return session.sessionName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Example: Show notification when sessions are refetched
  useEffect(() => {
    if (sessions.length > 0) {
      console.log(`Loaded ${sessions.length} active sessions`);
    }
  }, [sessions]);

  const footerSections = [
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/docs/api' },
        { label: 'Tutorials', href: '/docs/tutorials' },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Forum', href: 'https://forum.canfar.net', external: true },
        { label: 'GitHub', href: 'https://github.com/canfar', external: true },
        { label: 'Slack', href: '/community/slack' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/support' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'System Status', href: '/status' },
      ],
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* AppBar with Science Portal wordmark */}
      <AppBar
        variant="surface"
        position="sticky"
        elevation={0}
        wordmark="Science Portal"
        logoHref="/"
        menuLabel="Jane Doe"
        logo={<CanfarLogo />}
        links={appBarWithUserMenu.links}
        menuItems={appBarWithUserMenu.menuItems}
        accountButton={<ThemeToggle size="md" />}
      />

      {/* Main content area */}
      <Box component="main" sx={{ flex: 1, pt: 2 }}>
        {/* Active Sessions and User Storage Widgets - 80/20 split */}
        <Container maxWidth="xl" sx={{ mb: 4, px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 3,
            }}
          >
            {/* ActiveSessionsWidget - 80% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 80%' },
                minWidth: 0,
              }}
            >
              <ActiveSessionsWidget
                sessions={filteredSessions}
                layout="responsive"
                isLoading={isLoadingSessions}
                onRefresh={() => refetchSessions()}
              />
            </Box>

            {/* UserStorageWidget - 20% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 20%' },
                minWidth: 0,
                px: { xs: 1, sm: 2 },
              }}
            >
              <UserStorageWidget
                isAuthenticated={true}
                name="janedoe"
                testMode={true}
              />
            </Box>
          </Box>
        </Container>

        {/* 60/40 split container for LaunchFormWidget and PlatformLoad */}
        <Container maxWidth="xl" sx={{ mb: 4, px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 3,
            }}
          >
            {/* LaunchFormWidget - 60% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 60%' },
                minWidth: 0,
              }}
            >
              <LaunchFormWidget helpUrl="https://www.opencadc.org/science-containers/" />
            </Box>

            {/* PlatformLoad - 40% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 40%' },
                minWidth: 0,
                px: { xs: 1, sm: 2 },
              }}
            >
              {platformLoadData && (
                <PlatformLoad
                  data={platformLoadData}
                  isLoading={isLoadingPlatform}
                  onRefresh={() => refetchPlatform()}
                />
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer - full width */}
      <Footer
        sections={footerSections}
        copyright="© 2024 CANFAR. All rights reserved."
      />
    </Box>
  );
}
