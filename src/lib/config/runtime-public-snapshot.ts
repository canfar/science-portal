/**
 * Synchronous read of the latest public runtime config on the client.
 * Updated by `PublicRuntimeConfigProvider` so non-React modules (e.g. fetch helpers)
 * can build same-origin URLs without prop-drilling.
 */

import type { PublicRuntimeConfig } from '@/lib/config/public-runtime-config';
import { getProcessEnv } from '@/lib/config/safe-process-env';

let snapshot: PublicRuntimeConfig | null = null;

export function setPublicRuntimeSnapshot(config: PublicRuntimeConfig): void {
  snapshot = config;
}

export function getPublicRuntimeSnapshot(): PublicRuntimeConfig | null {
  return snapshot;
}

export function getRuntimeBasePath(): string {
  if (snapshot) {
    return snapshot.basePath;
  }
  return getProcessEnv('NEXT_PUBLIC_BASE_PATH') || '';
}
