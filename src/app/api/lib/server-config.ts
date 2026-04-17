/**
 * Server-Side API Configuration
 *
 * Configuration for server-side API calls to external services.
 * These environment variables are NOT exposed to the client.
 */

import { isOIDCAuth } from '@/lib/config/auth-config';

/**
 * Read env from this alias so values are resolved at runtime. Next.js replaces
 * `process.env.NEXT_PUBLIC_*` at build time when written as `process.env.NEXT_PUBLIC_*`,
 * which breaks Docker/K8s env injected after `next build`.
 */
const env = process.env;

/**
 * Check if using OIDC authentication mode (aligned with client and auth-config)
 */
function isOIDCMode(): boolean {
  return isOIDCAuth();
}

/**
 * Get Skaha API base URL based on auth mode
 * - OIDC mode: Uses NEXT_PUBLIC_SRC_SKAHA_API (src.canfar.net/skaha - accepts SKA IAM tokens)
 * - CANFAR mode: Uses SKAHA_API (ws-uv.canfar.net/skaha - accepts CANFAR auth)
 */
function getSkahaBaseUrl(): string {
  if (isOIDCMode()) {
    // OIDC mode: Use SRC Skaha API that accepts SKA IAM tokens
    const srcSkahaApi = env.NEXT_PUBLIC_SRC_SKAHA_API || env.SRC_SKAHA_API || 'https://src.canfar.net/skaha';
    console.log('🔍 Server config - OIDC mode, using SRC Skaha API:', srcSkahaApi);
    return srcSkahaApi;
  } else {
    // CANFAR mode: Use standard CANFAR Skaha API
    const canfarSkahaApi = env.SKAHA_API || env.NEXT_PUBLIC_SKAHA_API;
    console.log('🔍 Server config - CANFAR mode, using CANFAR Skaha API:', canfarSkahaApi);
    return canfarSkahaApi || '';
  }
}

/**
 * Get Storage API base URL based on auth mode
 * - OIDC mode: Uses SRC Cavern API (src.canfar.net/cavern/nodes/home/ - accepts SKA IAM tokens)
 * - CANFAR mode: Uses SERVICE_STORAGE_API (standard CANFAR storage)
 */
function getStorageBaseUrl(): string {
  if (isOIDCMode()) {
    // OIDC mode: Use SRC Cavern API that accepts SKA IAM tokens
    const srcCavernApi = env.NEXT_PUBLIC_SRC_CAVERN_API || env.SRC_CAVERN_API || 'https://src.canfar.net/cavern/nodes/home/';
    console.log('🔍 Server config - OIDC mode, using SRC Cavern API:', srcCavernApi);
    return srcCavernApi;
  } else {
    // CANFAR mode: Use standard CANFAR storage API
    const canfarStorageApi = env.SERVICE_STORAGE_API || env.NEXT_PUBLIC_SERVICE_STORAGE_API;
    console.log('🔍 Server config - CANFAR mode, using CANFAR Storage API:', canfarStorageApi);
    return canfarStorageApi || '';
  }
}

function apiTimeout(): number {
  return parseInt(env.API_TIMEOUT || env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10);
}

export type ServerApiConfig = {
  storage: { baseUrl: string; timeout: number };
  login: { baseUrl: string; timeout: number };
  ac: { baseUrl: string; timeout: number };
  passwordReset: { url: string; timeout: number };
  registration: {
    url: string;
    timeout: number;
    proxyHeaders: {
      resourceId: string;
      standardId: string;
      authType: string;
      interfaceTypeId: string;
    };
  };
  skaha: { baseUrl: string; timeout: number };
};

/**
 * Server-side API configuration
 * Uses server-only environment variables (without NEXT_PUBLIC_ prefix)
 * In OIDC mode, uses SRC endpoints (src.canfar.net)
 * In CANFAR mode, uses CANFAR endpoints (ws-*.canfar.net)
 *
 * Getters re-read env on each access so container runtime env is visible after `next build`.
 */
export const serverApiConfig: ServerApiConfig = {
  get storage() {
    return {
      baseUrl: getStorageBaseUrl(),
      timeout: apiTimeout(),
    };
  },
  get login() {
    return {
      baseUrl: env.LOGIN_API || env.NEXT_PUBLIC_LOGIN_API || '',
      timeout: apiTimeout(),
    };
  },
  get ac() {
    return {
      baseUrl: env.AC_API || env.NEXT_PUBLIC_AC_API || 'https://ws-uv.canfar.net/ac',
      timeout: apiTimeout(),
    };
  },
  get passwordReset() {
    return {
      url: env.PASSWORD_RESET_URL || env.NEXT_PUBLIC_PASSWORD_RESET_URL || 'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/access/passwordResetRequest',
      timeout: apiTimeout(),
    };
  },
  get registration() {
    return {
      url: env.REGISTRATION_URL || env.NEXT_PUBLIC_REGISTRATION_URL || 'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/access/control/proxy',
      timeout: apiTimeout(),
      proxyHeaders: {
        resourceId: env.CADC_PROXY_RESOURCE_ID || 'ivo://cadc.nrc.ca/gms',
        standardId: env.CADC_PROXY_STANDARD_ID || 'ivo://ivoa.net/std/UMS#reqs-0.1',
        authType: env.CADC_PROXY_AUTH_TYPE || 'anon',
        interfaceTypeId: env.CADC_PROXY_INTERFACE_TYPE_ID || 'http://www.ivoa.net/xml/VODataService/v1.1#ParamHTTP',
      },
    };
  },
  get skaha() {
    return {
      baseUrl: getSkahaBaseUrl(),
      timeout: apiTimeout(),
    };
  },
};

/**
 * Validates that all required server configuration is present
 */
export function validateServerConfig(): void {
  const required = [
    { name: 'SERVICE_STORAGE_API', value: serverApiConfig.storage.baseUrl },
    { name: 'LOGIN_API', value: serverApiConfig.login.baseUrl },
    { name: 'SKAHA_API', value: serverApiConfig.skaha.baseUrl },
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    const missingNames = missing.map(({ name }) => name).join(', ');
    console.warn(
      `Missing server environment variables: ${missingNames}. ` +
        `Falling back to NEXT_PUBLIC_ versions.`,
    );
  }
}

// Validate on import (server-side only)
if (typeof window === 'undefined') {
  validateServerConfig();
}
