'use client';

import { useMemo } from 'react';
import { buildApiRoutes } from '@/lib/config/api';
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';

export function useApiRoutes() {
  const { basePath } = usePublicRuntimeConfig();
  return useMemo(() => buildApiRoutes(basePath), [basePath]);
}
