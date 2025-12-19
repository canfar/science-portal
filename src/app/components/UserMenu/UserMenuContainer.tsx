'use client';

import React, { useState, useCallback } from 'react';
import { UserMenu } from './UserMenu';
import { LoginModal } from '@/app/components/LoginModal/LoginModal';
import { useAuthStatus, useLogin, useLogout } from '@/lib/hooks/useAuth';
import type { LoginCredentials } from '@/lib/api/login';

const RESET_PASSWORD_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/resetPassword.html';
const UPDATE_PROFILE_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/profile.html';
const OBTAIN_CERTIFICATE_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/certificate.html';

export function UserMenuContainer() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { data: authStatus, isLoading: isCheckingAuth } = useAuthStatus();
  const { mutate: login, isPending: isLoggingIn, error: loginError } = useLogin();
  const { mutate: logout } = useLogout();

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
            handleCloseLogin();
          },
        }
      );
    },
    [login, handleCloseLogin]
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleUpdateProfile = useCallback(() => {
    window.open(UPDATE_PROFILE_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleResetPassword = useCallback(() => {
    window.open(RESET_PASSWORD_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleObtainCertificate = useCallback(() => {
    window.open(OBTAIN_CERTIFICATE_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const isAuthenticated = authStatus?.authenticated ?? false;
  const userName = authStatus?.user?.displayName ?? authStatus?.user?.username;

  return (
    <>
      <UserMenu
        isAuthenticated={isAuthenticated}
        userName={userName}
        onLogin={handleOpenLogin}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        onResetPassword={handleResetPassword}
        onObtainCertificate={handleObtainCertificate}
      />
      <LoginModal
        open={loginModalOpen}
        onClose={handleCloseLogin}
        onSubmit={handleLogin}
        isLoading={isLoggingIn}
        errorMessage={loginError?.message}
      />
    </>
  );
}
