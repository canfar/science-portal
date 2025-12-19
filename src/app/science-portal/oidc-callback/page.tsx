'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { saveToken } from '@/lib/auth/token-storage';

/**
 * OIDC Callback Page
 *
 * This page handles the callback from the OIDC provider after authentication.
 * NextAuth handles the token exchange, then we extract the token and store it in localStorage.
 */
export default function OIDCCallbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    // Wait for NextAuth session to be ready
    if (status === 'loading') {
      return;
    }

    // If authenticated and we have an access token, save it to localStorage
    if (status === 'authenticated' && session?.accessToken && !tokenSaved) {
      console.log('\n' + '💾'.repeat(40));
      console.log('💾 OIDC Callback - Saving token to localStorage');
      console.log('💾'.repeat(40));
      console.log('📋 FULL TOKEN BEING SAVED:');
      console.log(session.accessToken);
      console.log('\n📋 Token length:', session.accessToken.length);
      console.log('📋 First 100 chars:', session.accessToken.substring(0, 100));
      console.log('💾'.repeat(40) + '\n');

      saveToken(session.accessToken);
      setTokenSaved(true);

      // Redirect to dashboard after saving token
      setTimeout(() => {
        router.push('/science-portal');
      }, 500);
    } else if (status === 'unauthenticated') {
      // Authentication failed, redirect back to login
      console.error('❌ Authentication failed in OIDC callback');
      router.push('/science-portal');
    }
  }, [status, session, tokenSaved, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Completing authentication...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we set up your session.
      </Typography>
    </Box>
  );
}
