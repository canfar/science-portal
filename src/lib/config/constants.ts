/**
 * Application Constants
 *
 * Centralized constants for session types, default values, and configuration.
 */

// Session resource defaults
export const DEFAULT_CORES_NUMBER = 2;
export const DEFAULT_RAM_NUMBER = 8;

// Session type constants
export const NOTEBOOK_TYPE = 'notebook';
export const CARTA_TYPE = 'carta';
export const CONTRIBUTED_TYPE = 'contributed';
export const DESKTOP_TYPE = 'desktop';
export const FIREFLY_TYPE = 'firefly';

// Project constant
export const SKAHA_PROJECT = 'skaha';

// Default container images by session type
export const DEFAULT_NOTEBOOK_SKAHA_IMAGE = 'astroml:latest';
export const DEFAULT_DESKTOP_SKAHA_IMAGE = 'desktop:latest';
export const DEFAULT_FIREFLY_SKAHA_IMAGE = 'firefly:2025.2';
export const DEFAULT_CARTA_SKAHA_IMAGE = 'carta:latest';
export const DEFAULT_CONTRIBUTED_SKAHA_IMAGE = 'astroml-vscode:latest';

// Mapping of session types to their default images
export const DEFAULT_IMAGE_NAMES = {
  [CARTA_TYPE]: DEFAULT_CARTA_SKAHA_IMAGE,
  [CONTRIBUTED_TYPE]: DEFAULT_CONTRIBUTED_SKAHA_IMAGE,
  [DESKTOP_TYPE]: DEFAULT_DESKTOP_SKAHA_IMAGE,
  [NOTEBOOK_TYPE]: DEFAULT_NOTEBOOK_SKAHA_IMAGE,
  [FIREFLY_TYPE]: DEFAULT_FIREFLY_SKAHA_IMAGE,
} as const;

// Session types that support custom resource allocation (fixed resources)
export const HAS_FIXED_RESOURCES = [
  CARTA_TYPE,
  CONTRIBUTED_TYPE,
  NOTEBOOK_TYPE,
] as const;

// Session types that use flexible (platform-managed) resources only
export const HAS_FLEXIBLE_RESOURCES_ONLY = [
  DESKTOP_TYPE,
  FIREFLY_TYPE,
] as const;

/**
 * Check if a session type supports custom resource allocation
 */
export function supportsCustomResources(sessionType: string): boolean {
  return HAS_FIXED_RESOURCES.includes(sessionType as typeof HAS_FIXED_RESOURCES[number]);
}

/**
 * Get the default container image for a session type
 */
export function getDefaultImageForType(sessionType: string): string {
  return DEFAULT_IMAGE_NAMES[sessionType as keyof typeof DEFAULT_IMAGE_NAMES] || DEFAULT_NOTEBOOK_SKAHA_IMAGE;
}
