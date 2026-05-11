'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppBar } from '@/app/components/AppBar/AppBar';
import { AppBarProps } from '@/app/types/AppBarProps';
import { LoginModal } from '@/app/components/LoginModal/LoginModal';
import { ResetPasswordModal } from '@/app/components/ResetPasswordModal/ResetPasswordModal';
import {
  useAuthStatus,
  useLogin,
  useLogout,
  useOIDCLogin,
  useAuthModeSync,
} from '@/lib/hooks/useAuth';
import type { LoginCredentials } from '@/lib/api/login';
import { PersonOutline, VpnKey, Verified, Logout as LogoutIcon } from '@mui/icons-material';
import { Box, CircularProgress, Typography } from '@mui/material';
import { UPDATE_PROFILE_URL, getCertificateUrl } from '@/lib/config/site-config';
import { saveCredentials, getCredentials, removeCredentials } from '@/lib/auth/token-storage';

interface AppBarWithAuthProps extends Omit<AppBarProps, 'menuLabel' | 'menuItems'> {
  /**
   * Show login button instead of user menu when not authenticated
   */
  showLoginButton?: boolean;
}

export function AppBarWithAuth({
  showLoginButton = true,
  logo,
  logoHref,
  onLogoClick,
  wordmark,
  links,
  accountButton,
  position,
  elevation,
  variant,
  sx,
}: AppBarWithAuthProps) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [isOidcLoginPending, setIsOidcLoginPending] = useState(false);
  const oidcLoginInFlightRef = useRef(false);
  const { data: authStatus, isLoading: isCheckingAuth } = useAuthStatus();
  const { mutate: login, isPending: isLoggingIn, error: loginError } = useLogin();
  const { mutate: logout } = useLogout();
  const { login: oidcLogin, isOIDCMode } = useOIDCLogin();

  // Sync auth mode from environment
  useAuthModeSync();

  // Track whether we've already auto-opened the modal this page lifetime.
  // Effect that actually opens it lives below, after `isAuthenticated` is
  // computed — but the ref needs to exist before any renders so it's stable
  // across the lifetime of this component instance.
  const autoOpenedRef = useRef(false);

  const handleOpenLogin = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  const handleCloseLogin = useCallback(() => {
    setLoginModalOpen(false);
  }, []);

  const handleLogin = useCallback(
    (credentials: LoginCredentials) => {
      login(
        {
          username: credentials.username,
          password: credentials.password,
        },
        {
          onSuccess: () => {
            // Save credentials for certificate generation
            saveCredentials(credentials.username, credentials.password);
            handleCloseLogin();
          },
        },
      );
    },
    [login, handleCloseLogin],
  );

  const handleLogout = useCallback(() => {
    // CANFAR mode: useLogout's mutationFn navigates the browser to the access
    // service `/access/logout?target=…`, which invalidates the session, clears
    // the `.canfar.net` cookie, and redirects back to the portal. The portal
    // remounts fresh — that IS the reset; no manual `window.location.href`
    // override needed (it would race with the access-service redirect).
    // OIDC mode: NextAuth's `signOut()` handles the navigation itself.
    // `useLogoutReset` in page.tsx remains as a safety net for non-button
    // auth transitions (e.g. server-side session expiry).
    removeCredentials();
    logout();
  }, [logout]);

  const handleUpdateProfile = useCallback(() => {
    window.open(UPDATE_PROFILE_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleResetPassword = useCallback(() => {
    // Open reset password modal in CANFAR mode
    // In OIDC mode, this menu item is not shown
    setResetPasswordModalOpen(true);
  }, []);

  const handleObtainCertificate = useCallback(() => {
    // Get stored credentials for HTTP Basic Auth
    const credentials = getCredentials();

    if (credentials) {
      // Generate certificate URL with HTTP Basic Auth credentials
      const certificateUrl = getCertificateUrl(credentials.username, credentials.password);
      window.open(certificateUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: if credentials not available, prompt user to re-login
      console.warn('No stored credentials found. Please log in again.');
      alert('Please log in again to obtain a certificate.');
    }
  }, []);

  const isAuthenticated = authStatus?.authenticated ?? false;

  // Auto-open the login modal once per page lifetime when the auth check
  // resolves and the user is unauthenticated. CANFAR mode only — auto-
  // redirecting to the OIDC provider would be intrusive, so users click Login
  // themselves there. `autoOpenedRef` ensures dismissing the modal doesn't
  // immediately re-open it on the next render; a page reload resets the ref
  // so the prompt appears again.
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (isCheckingAuth) return;
    if (isOIDCMode) return;
    if (!showLoginButton) return;
    if (isAuthenticated) return;
    autoOpenedRef.current = true;
    setLoginModalOpen(true);
  }, [isCheckingAuth, isAuthenticated, isOIDCMode, showLoginButton]);

  // Get user's first and last name, fallback to username or 'User'
  const firstName = authStatus?.user?.firstName ?? '';
  const lastName = authStatus?.user?.lastName ?? '';
  const username = authStatus?.user?.username ?? '';

  // Build display name: "FirstName LastName" or username as fallback
  const displayName =
    firstName && lastName ? `${firstName} ${lastName}`.trim() : username || 'User';

  // Don't show menu items while checking auth status to prevent flickering
  // Only show menu when we have auth status data
  const showAuthenticatedMenu = !isCheckingAuth && authStatus !== undefined && isAuthenticated;

  // Menu items shown when authenticated
  // CANFAR-specific items only show in CANFAR mode
  const authenticatedMenuItems = [
    ...(!isOIDCMode
      ? [
          {
            label: 'Update Profile',
            onClick: handleUpdateProfile,
            icon: <PersonOutline fontSize="small" />,
          },
          {
            label: 'Reset Password',
            onClick: handleResetPassword,
            icon: <VpnKey fontSize="small" />,
          },
          {
            label: 'Obtain Certificate',
            onClick: handleObtainCertificate,
            icon: <Verified fontSize="small" />,
          },
        ]
      : []),
    {
      label: 'Logout',
      onClick: handleLogout,
      icon: <LogoutIcon fontSize="small" />,
      divider: !isOIDCMode, // Only show divider if CANFAR items are present
    },
  ];

  // Always show at least one dummy menu item to keep button visible
  // Empty label will trigger custom click handler in appBar
  const dummyMenuItem = [
    {
      label: '',
      onClick: () => {},
    },
  ];

  // Menu items for unauthenticated state - use dummy to keep button visible
  const unauthenticatedMenuItems = dummyMenuItem;

  // Menu items for loading state - use dummy to keep button visible
  const loadingMenuItem = dummyMenuItem;

  // Handle account button click - open login modal or redirect to OIDC provider
  const handleAccountButtonClick = useCallback(async () => {
    if (!isCheckingAuth && !isAuthenticated && showLoginButton) {
      if (isOIDCMode) {
        if (oidcLoginInFlightRef.current) {
          return;
        }
        oidcLoginInFlightRef.current = true;
        setIsOidcLoginPending(true);
        try {
          await oidcLogin();
        } catch (error) {
          console.error('OIDC sign-in failed:', error);
        } finally {
          oidcLoginInFlightRef.current = false;
          setIsOidcLoginPending(false);
        }
      } else {
        handleOpenLogin();
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    showLoginButton,
    isOIDCMode,
    oidcLogin,
    handleOpenLogin,
  ]);

  // Determine menu items to pass
  const menuItemsToPass = isCheckingAuth
    ? loadingMenuItem
    : showAuthenticatedMenu
      ? authenticatedMenuItems
      : unauthenticatedMenuItems;

  // Determine menu label
  const menuLabelToShow = isCheckingAuth ? (
    <CircularProgress size={20} color="inherit" />
  ) : showAuthenticatedMenu ? (
    displayName
  ) : isOIDCMode && isOidcLoginPending ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={20} color="inherit" />
      <Typography component="span" variant="body2" color="inherit" sx={{ whiteSpace: 'nowrap' }}>
        Signing in…
      </Typography>
    </Box>
  ) : (
    'Login'
  );

  return (
    <>
      <AppBar
        logo={logo}
        logoHref={logoHref}
        onLogoClick={onLogoClick}
        wordmark={wordmark}
        links={links}
        menuLabel={menuLabelToShow}
        menuItems={menuItemsToPass}
        onAccountButtonClick={handleAccountButtonClick}
        accountActionDisabled={isOIDCMode && isOidcLoginPending}
        accountButton={accountButton}
        position={position}
        elevation={elevation}
        variant={variant}
        sx={sx}
      />
      {/* Only show login modal in CANFAR mode. The "Forgot your Account
          information?" and "Request a CADC Account" links are intentionally
          NOT wired to local handlers so the modal falls through to its
          built-in external anchors (target="_blank") pointing at the CADC
          account-management pages. */}
      {!isOIDCMode && (
        <LoginModal
          open={loginModalOpen}
          onClose={handleCloseLogin}
          onSubmit={handleLogin}
          isLoading={isLoggingIn}
          errorMessage={loginError?.message}
        />
      )}
      {/* Reset-password modal is still triggered from the authenticated
          user-account menu (`handleResetPassword`). */}
      {!isOIDCMode && (
        <ResetPasswordModal
          open={resetPasswordModalOpen}
          onClose={() => setResetPasswordModalOpen(false)}
        />
      )}
    </>
  );
}
