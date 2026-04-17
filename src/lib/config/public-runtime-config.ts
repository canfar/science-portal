/**
 * Values exposed to the browser that must reflect container/runtime env.
 * Read via `getPublicRuntimeConfigFromEnv()` on the server (request/build) or
 * `PublicRuntimeConfigProvider` on the client.
 */

import { getProcessEnv } from '@/lib/config/safe-process-env';

export type PublicRuntimeConfig = {
  basePath: string;
  useCanfar: boolean;
  experimental: boolean;
  apiTimeout: number;
  devtools: boolean;
};

export function getPublicRuntimeConfigFromEnv(): PublicRuntimeConfig {
  return {
    basePath: getProcessEnv('NEXT_PUBLIC_BASE_PATH') || '',
    useCanfar:
      getProcessEnv('NEXT_USE_CANFAR') === 'true' ||
      getProcessEnv('NEXT_PUBLIC_USE_CANFAR') === 'true',
    experimental: getProcessEnv('NEXT_PUBLIC_EXPERIMENTAL') === 'true',
    apiTimeout: parseInt(getProcessEnv('NEXT_PUBLIC_API_TIMEOUT') || '30000', 10),
    devtools: getProcessEnv('NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS') === 'true',
  };
}
