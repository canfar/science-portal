/**
 * Site Navigation Configuration
 *
 * Centralized URLs for external links and navigation items.
 */

// Documentation
export const DOCS_URL = 'https://www.opencadc.org/canfar/latest/';
export const ABOUT_URL = 'https://www.opencadc.org/canfar/latest/about/home/';
export const OPEN_SOURCE_URL = 'https://github.com/opencadc';

// Support
export const SUPPORT_EMAIL = 'mailto:support@canfar.net';
export const DISCORD_URL = 'https://discord.gg/vcCQ8QBvBa';
export const STATUS_PAGE_URL = 'https://canfar.statuspage.io/';

// Services (defaults; override at runtime with NEXT_PUBLIC_SERVICE_*_URL in public runtime config)
export const STORAGE_MANAGEMENT_URL = 'https://www.canfar.net/storage/list';
export const GROUP_MANAGEMENT_URL = 'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/groups/';
export const DATA_PUBLICATION_URL = 'https://www.canfar.net/citation';
/** URL for this Science Portal instance in the Services menu (set NEXT_PUBLIC_SERVICE_SCIENCE_PORTAL_URL to override at runtime). */
export const SCIENCE_PORTAL_URL = 'https://www.canfar.net/science-portal';
export const CADC_SEARCH_URL = 'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/search';
export const OPENSTACK_CLOUD_URL = 'https://arbutus-canfar.cloud.computecanada.ca/';

// User Account Management
export const UPDATE_PROFILE_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/update.html';
export const RESET_PASSWORD_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/resetPassword.html';
export const CERTIFICATE_BASE_URL =
  'https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/cred/generate?daysValid=30';

/**
 * Generate a certificate URL with HTTP Basic Auth credentials
 * @param username - User's username
 * @param password - User's password
 * @returns URL with embedded credentials for certificate generation
 */
export const getCertificateUrl = (username: string, password: string): string => {
  return `https://${username}:${password}@ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/cred/generate?daysValid=30`;
};
