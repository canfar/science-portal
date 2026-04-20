'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { ActiveSessionsWidget } from '@/app/components/ActiveSessionsWidget/ActiveSessionsWidget';
import { UserStorageWidget } from '@/app/components/UserStorageWidget/UserStorageWidget';
import { LaunchFormWidget } from '@/app/components/LaunchFormWidget/LaunchFormWidget';
import { PlatformLoad } from '@/app/components/PlatformLoad/PlatformLoad';
import { Footer } from '@/app/components/Footer/Footer';
import { Box } from '@/app/components/Box/Box';
import { Container } from '@mui/material';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { appBarWithUserMenu, CanfarLogo, SRCNetLogo } from '@/stories/shared/navigation';
import type { SessionCardProps } from '@/app/types/SessionCardProps';
import { useAuthStatus } from '@/lib/hooks/useAuth';
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';
import {
  useSessions,
  useDeleteSession,
  useRenewSession,
  useLaunchSession,
  useSessionPolling,
} from '@/lib/hooks/useSessions';
import { useContainerImages, useImageRepositories, useContext } from '@/lib/hooks/useImages';
import { STATIC_PLATFORM_LOAD_DATA } from '@/lib/config/static-platform-load';
import { useQueryClient } from '@tanstack/react-query';
import type { Session, SessionLaunchParams } from '@/lib/api/skaha';
import {
  DOCS_URL,
  ABOUT_URL,
  OPEN_SOURCE_URL,
  SUPPORT_EMAIL,
  DISCORD_URL,
  STORAGE_MANAGEMENT_URL,
  GROUP_MANAGEMENT_URL,
  DATA_PUBLICATION_URL,
  SCIENCE_PORTAL_URL,
  CADC_SEARCH_URL,
  OPENSTACK_CLOUD_URL,
} from '@/lib/config/site-config';

export default function SciencePortalPage() {
  const { useCanfar } = usePublicRuntimeConfig();
  const isOIDCMode = !useCanfar;

  // OIDC token mirror: useAuthStatus → useAuth syncs session.accessToken to localStorage

  // Get authentication status and query client for cache management
  const { data: authStatus, isLoading: authLoading } = useAuthStatus();
  const isAuthenticated = authStatus?.authenticated ?? false;
  const showLoggedOutCopy = !authLoading && !isAuthenticated;
  const queryClient = useQueryClient();

  // Track previous auth state to detect logout
  const [prevAuthState, setPrevAuthState] = useState(isAuthenticated);

  // Track which sessions are currently being operated on (delete/renew)
  const [operatingSessionIds, setOperatingSessionIds] = useState<Set<string>>(new Set());

  // Track which sessions are being polled after launch
  const [pollingSessionId, setPollingSessionId] = useState<string | null>(null);

  // Detect logout and trigger page reload to reset everything
  useEffect(() => {
    // If user logged out, clear everything and reload the page
    if (!isAuthenticated && prevAuthState === true) {
      setPrevAuthState(isAuthenticated);

      // Clear all queries except auth status
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes('auth');
        },
      });

      // Remove all non-auth queries from cache
      queryClient.removeQueries({
        predicate: (query) => {
          return !query.queryKey.includes('auth');
        },
      });

      // Clear nuqs state from URL (remove all query parameters)
      // and reload the page to reset all state
      const currentUrl = new URL(window.location.href);
      currentUrl.search = ''; // Clear all query parameters
      window.location.href = currentUrl.toString(); // Full page reload
    } else if (isAuthenticated && prevAuthState === false) {
      setPrevAuthState(isAuthenticated);
    }
  }, [isAuthenticated, prevAuthState, queryClient]);

  // Fetch active sessions using the hook
  const {
    data: sessions = [],
    isLoading,
    isFetching,
    refetch: refetchSessions,
  } = useSessions(isAuthenticated);

  // Platform load: live stats disabled (CADC-15555 / opencadc/science-portal#158) — static placeholder + overlay

  // Fetch container images and repositories for the Launch Form
  const {
    data: imagesByType = {},
    isLoading: isLoadingImages,
    isFetching: isFetchingImages,
    refetch: refetchImages,
  } = useContainerImages(isAuthenticated);

  const {
    data: imageRepositories = [],
    isLoading: isLoadingRepositories,
    isFetching: isFetchingRepositories,
    refetch: refetchRepositories,
  } = useImageRepositories(isAuthenticated);

  // Fetch context (available cores, RAM, GPU options)
  const {
    data: context,
    isLoading: isLoadingContext,
    isFetching: isFetchingContext,
    refetch: refetchContext,
  } = useContext(isAuthenticated);

  // Debug: Log context state
  useEffect(() => {
    console.log('🔍 Context Hook State:', {
      isAuthenticated,
      isLoadingContext,
      isFetchingContext,
      hasData: !!context,
      context,
    });
  }, [isAuthenticated, isLoadingContext, isFetchingContext, context]);

  // Mutation hooks for session actions
  const { mutate: deleteSession } = useDeleteSession({
    onSuccess: (_, sessionId) => {
      console.log('Session deleted successfully');
      // Keep operating state for 3 seconds while verification happens
      setTimeout(() => {
        setOperatingSessionIds((prev) => {
          const next = new Set(prev);
          next.delete(sessionId);
          return next;
        });
      }, 3500); // Slightly longer than the 3s verification delay
    },
    onError: (error, sessionId) => {
      console.error('Failed to delete session:', error);
      // Remove operating state on error
      setOperatingSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    },
  });

  const { mutate: renewSession } = useRenewSession({
    onSuccess: (_, { sessionId }) => {
      console.log('Session renewed successfully');
      // Remove operating state immediately since we trust the API response
      setOperatingSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    },
    onError: (error, { sessionId }) => {
      console.error('Failed to renew session:', error);
      // Remove operating state on error
      setOperatingSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    },
  });

  const { mutateAsync: launchSessionAsync } = useLaunchSession({
    onSuccess: (newSession) => {
      console.log('Session launched successfully:', newSession.id);
      // Start polling this session
      setPollingSessionId(newSession.id);
    },
    onError: (error) => {
      console.error('Failed to launch session:', error);
    },
  });

  // Wrap the mutation in a function that can be passed to LaunchFormWidget
  const handleLaunchSession = useCallback(
    async (params: SessionLaunchParams): Promise<Session> => {
      return await launchSessionAsync(params);
    },
    [launchSessionAsync],
  );

  // Session polling hook for newly launched sessions
  const { startPolling, stopPolling } = useSessionPolling(pollingSessionId, {
    interval: 30000, // Poll every 30 seconds
    onStatusChange: (session) => {
      console.log('Session status changed:', session.status);
    },
    onComplete: () => {
      console.log('Session polling complete');
      setPollingSessionId(null);
    },
    onError: (error) => {
      console.error('Error polling session:', error);
      setPollingSessionId(null);
    },
  });

  // Start polling when pollingSessionId changes
  useEffect(() => {
    if (pollingSessionId) {
      startPolling();
    }
    return () => {
      stopPolling();
    };
  }, [pollingSessionId, startPolling, stopPolling]);

  // LOADING: show skeletons while auth is unknown, or while authenticated and data is loading/refetching
  const isLoadingSessions =
    authLoading || (isAuthenticated && (isLoading || isFetching));
  const isLoadingLaunchForm =
    authLoading ||
    (isAuthenticated &&
      (isLoadingImages ||
        isLoadingRepositories ||
        isLoadingContext ||
        isFetchingImages ||
        isFetchingRepositories ||
        isFetchingContext));
  const isLoadingUserStorage = authLoading;

  // Create stable handlers using useCallback
  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      // Add to operating set
      setOperatingSessionIds((prev) => new Set(prev).add(sessionId));
      deleteSession(sessionId);
    },
    [deleteSession],
  );

  const handleRenewSession = useCallback(
    (sessionId: string) => {
      // Add to operating set
      setOperatingSessionIds((prev) => new Set(prev).add(sessionId));
      // Default to 12 hours extension - this will be customizable via modal
      renewSession({ sessionId, hours: 12 });
    },
    [renewSession],
  );

  // Transform Session data to SessionCardProps format with action handlers
  // NOTE: We do NOT include isOperating here - it's passed separately to avoid recreating the array
  const activeSessions: SessionCardProps[] = useMemo(() => {
    return sessions.map((session: Session) => ({
      id: session.id,
      sessionId: session.sessionId,
      sessionType: session.sessionType,
      sessionName: session.sessionName,
      status: session.status,
      containerImage: session.containerImage,
      startedTime: session.startedTime,
      expiresTime: session.expiresTime,
      memoryUsage: session.memoryUsage,
      memoryAllocated: session.memoryAllocated,
      cpuUsage: session.cpuUsage,
      cpuAllocated: session.cpuAllocated,
      gpuAllocated: session.gpuAllocated,
      isFixedResources: session.isFixedResources,
      connectUrl: session.connectUrl,
      requestedRAM: session.requestedRAM,
      requestedCPU: session.requestedCPU,
      requestedGPU: session.requestedGPU,
      onDelete: () => handleDeleteSession(session.id),
      onExtendTime: () => handleRenewSession(session.id),
    }));
  }, [sessions, handleDeleteSession, handleRenewSession]);

  // Handle refresh for ActiveSessionsWidget
  const handleSessionsRefresh = useCallback(() => {
    // Refetch sessions from API
    refetchSessions();
  }, [refetchSessions]);

  // Handle refresh for Launch Form (images, repositories, and context)
  const handleLaunchFormRefresh = useCallback(() => {
    // Refetch images, repositories, and context
    refetchImages();
    refetchRepositories();
    refetchContext();
  }, [refetchImages, refetchRepositories, refetchContext]);

  const footerSections = [
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: DOCS_URL, external: true },
        { label: 'About', href: ABOUT_URL, external: true },
        { label: 'Open Source', href: OPEN_SOURCE_URL, external: true },
      ],
    },
    {
      title: 'Services',
      links: [
        {
          label: 'Storage Management',
          href: STORAGE_MANAGEMENT_URL,
          external: true,
        },
        {
          label: 'Group Management',
          href: GROUP_MANAGEMENT_URL,
          external: true,
        },
        {
          label: 'Data Publication',
          href: DATA_PUBLICATION_URL,
          external: true,
        },
        { label: 'Science Portal', href: SCIENCE_PORTAL_URL, external: true },
        { label: 'CADC Search', href: CADC_SEARCH_URL, external: true },
        { label: 'OpenStack Cloud', href: OPENSTACK_CLOUD_URL, external: true },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help', href: SUPPORT_EMAIL, external: false },
        { label: 'Join us on Discord', href: DISCORD_URL, external: true },
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
      <AppBarWithAuth
        variant="surface"
        position="sticky"
        elevation={0}
        wordmark="Science Portal"
        logoHref="/"
        logo={isOIDCMode ? <SRCNetLogo /> : <CanfarLogo />}
        links={isOIDCMode ? [] : appBarWithUserMenu.links}
        accountButton={<ThemeToggle size="md" />}
        showLoginButton={true}
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
                minWidth: 0, // Prevent flex item from overflowing
              }}
            >
              <ActiveSessionsWidget
                sessions={activeSessions}
                operatingSessionIds={operatingSessionIds}
                pollingSessionId={pollingSessionId}
                layout="responsive"
                isLoading={isLoadingSessions}
                onRefresh={handleSessionsRefresh}
                emptyMessage={
                  showLoggedOutCopy
                    ? 'Sign in to see your active sessions. Use the Login button in the header.'
                    : 'No active sessions'
                }
              />
            </Box>

            {/* UserStorageWidget - 20% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 20%' },
                minWidth: 0, // Prevent flex item from overflowing
                px: { xs: 1, sm: 2 }, // Add horizontal padding
              }}
            >
              <UserStorageWidget
                isAuthenticated={isAuthenticated}
                name={authStatus?.user?.username || ''}
                isLoading={isLoadingUserStorage}
                emptyMessage={
                  showLoggedOutCopy
                    ? 'Sign in to view your storage usage. Use the Login button in the header.'
                    : 'No storage data available'
                }
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
                minWidth: 0, // Prevent flex item from overflowing
              }}
            >
              <LaunchFormWidget
                helpUrl="https://www.opencadc.org/canfar/latest/platform/sessions/"
                signInAlertMessage={
                  showLoggedOutCopy
                    ? 'Sign in to launch sessions. Use the Login button in the header.'
                    : undefined
                }
                imagesByType={imagesByType}
                repositoryHosts={imageRepositories
                  .map((repo) => repo.host)
                  .filter((host): host is string => Boolean(host))}
                isLoading={isLoadingLaunchForm}
                onRefresh={handleLaunchFormRefresh}
                activeSessions={sessions}
                launchSessionFn={handleLaunchSession}
                coreOptions={context?.cores.options}
                memoryOptions={context?.memoryGB.options}
                gpuOptions={context?.gpus.options}
              />
            </Box>

            {/* PlatformLoad - 40% width on large screens */}
            <Box
              sx={{
                flex: { xs: 1, lg: '0 0 40%' },
                minWidth: 0, // Prevent flex item from overflowing
                px: { xs: 1, sm: 2 }, // Add horizontal padding
              }}
            >
              <PlatformLoad
                data={STATIC_PLATFORM_LOAD_DATA}
                isLoading={false}
                showDisabledOverlay
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer - full width - CANFAR mode only */}
      {!isOIDCMode && <Footer sections={footerSections} copyright="© 2022-2025" />}
    </Box>
  );
}
