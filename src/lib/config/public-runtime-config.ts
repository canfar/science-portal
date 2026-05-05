/**
 * Values exposed to the browser that must reflect container/runtime env.
 * Read via `getPublicRuntimeConfigFromEnv()` on the server (request/build) or
 * `PublicRuntimeConfigProvider` on the client.
 */

import { getProcessEnv } from '@/lib/config/safe-process-env';
import {
  STORAGE_MANAGEMENT_URL,
  GROUP_MANAGEMENT_URL,
  DATA_PUBLICATION_URL,
  SCIENCE_PORTAL_URL,
  CADC_SEARCH_URL,
  OPENSTACK_CLOUD_URL,
} from '@/lib/config/site-config';

export type ServiceNavUrls = {
  storageManagement: string;
  groupManagement: string;
  dataPublication: string;
  /** Canonical URL of this Science Portal deployment (Services menu). */
  sciencePortal: string;
  cadcSearch: string;
  openstackCloud: string;
};

export type PublicRuntimeConfig = {
  basePath: string;
  useCanfar: boolean;
  apiTimeout: number;
  devtools: boolean;
  serviceUrls: ServiceNavUrls;
};

export function getPublicRuntimeConfigFromEnv(): PublicRuntimeConfig {
  return {
    basePath: getProcessEnv('NEXT_PUBLIC_BASE_PATH') || '',
    useCanfar:
      getProcessEnv('NEXT_USE_CANFAR') === 'true' ||
      getProcessEnv('NEXT_PUBLIC_USE_CANFAR') === 'true',
    apiTimeout: parseInt(getProcessEnv('NEXT_PUBLIC_API_TIMEOUT') || '30000', 10),
    devtools: getProcessEnv('NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS') === 'true',
    serviceUrls: {
      storageManagement:
        getProcessEnv('NEXT_PUBLIC_SERVICE_STORAGE_MANAGEMENT_URL') || STORAGE_MANAGEMENT_URL,
      groupManagement:
        getProcessEnv('NEXT_PUBLIC_SERVICE_GROUP_MANAGEMENT_URL') || GROUP_MANAGEMENT_URL,
      dataPublication:
        getProcessEnv('NEXT_PUBLIC_SERVICE_DATA_PUBLICATION_URL') || DATA_PUBLICATION_URL,
      sciencePortal:
        getProcessEnv('NEXT_PUBLIC_SERVICE_SCIENCE_PORTAL_URL') || SCIENCE_PORTAL_URL,
      cadcSearch: getProcessEnv('NEXT_PUBLIC_SERVICE_CADC_SEARCH_URL') || CADC_SEARCH_URL,
      openstackCloud:
        getProcessEnv('NEXT_PUBLIC_SERVICE_OPENSTACK_CLOUD_URL') || OPENSTACK_CLOUD_URL,
    },
  };
}
