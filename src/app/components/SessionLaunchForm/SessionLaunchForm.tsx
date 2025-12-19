'use client';

import { Suspense } from 'react';
import { SessionLaunchFormImpl } from '@/app/implementation/sessionLaunchForm';
import { SessionLaunchFormProps } from '@/app/types/SessionLaunchFormProps';
import { Skeleton, Box } from '@mui/material';

function SessionLaunchFormFallback() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={40} />
    </Box>
  );
}

export function SessionLaunchForm(props: SessionLaunchFormProps) {
  return (
    <Suspense fallback={<SessionLaunchFormFallback />}>
      <SessionLaunchFormImpl {...props} />
    </Suspense>
  );
}
