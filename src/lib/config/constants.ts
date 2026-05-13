/**
 * Application Constants
 *
 * Centralized constants for session types, default values, and configuration.
 */

// Session resource defaults
export const DEFAULT_CORES_NUMBER = 1;
export const DEFAULT_RAM_NUMBER = 1;
export const DEFAULT_GPU_NUMBER = 0;

// Fallback option lists for the resource sliders / stepper buttons when the
// Skaha `context` endpoint doesn't supply them. Used by the launch form.
export const DEFAULT_MEMORY_OPTIONS = [
  1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 28, 30, 32, 36, 40, 44, 48, 56, 64, 80, 92, 112, 128,
  140, 170, 192,
] as const;

export const DEFAULT_CORE_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);

// Per-user cap on concurrently running interactive (non-headless) sessions.
export const MAX_INTERACTIVE_SESSIONS = 3;

// Session type constants
export const NOTEBOOK_TYPE = 'notebook';
export const CARTA_TYPE = 'carta';
export const CONTRIBUTED_TYPE = 'contributed';
export const DESKTOP_TYPE = 'desktop';
export const FIREFLY_TYPE = 'firefly';

// Default registry + project. Skaha images take the form
// `${REGISTRY}/${PROJECT}/${name}:${version}`. These are the values the form
// pre-selects when launching a session without explicit user input.
export const DEFAULT_IMAGE_REGISTRY = 'images.canfar.net';
export const SKAHA_PROJECT = 'skaha';

// Default container images by session type — these must match the legacy
// science-portal's constants (src/react/utilities/constants.js on
// opencadc/science-portal main). The form prefers these when the matching
// image is present in the available-images list for the active registry +
// project; otherwise it falls back to the first available image.
export const DEFAULT_NOTEBOOK_SKAHA_IMAGE = 'astroml:latest';
export const DEFAULT_DESKTOP_SKAHA_IMAGE = 'desktop:latest';
export const DEFAULT_FIREFLY_SKAHA_IMAGE = 'firefly:2025.2';
export const DEFAULT_CARTA_SKAHA_IMAGE = 'carta:latest';
export const DEFAULT_CONTRIBUTED_SKAHA_IMAGE = 'vscode:latest';

// Mapping of session types to their default images
export const DEFAULT_IMAGE_NAMES = {
  [CARTA_TYPE]: DEFAULT_CARTA_SKAHA_IMAGE,
  [CONTRIBUTED_TYPE]: DEFAULT_CONTRIBUTED_SKAHA_IMAGE,
  [DESKTOP_TYPE]: DEFAULT_DESKTOP_SKAHA_IMAGE,
  [NOTEBOOK_TYPE]: DEFAULT_NOTEBOOK_SKAHA_IMAGE,
  [FIREFLY_TYPE]: DEFAULT_FIREFLY_SKAHA_IMAGE,
} as const;

// Session types that support custom resource allocation (fixed resources)
export const HAS_FIXED_RESOURCES = [CARTA_TYPE, CONTRIBUTED_TYPE, NOTEBOOK_TYPE] as const;

// Session types that use flexible (platform-managed) resources only
export const HAS_FLEXIBLE_RESOURCES_ONLY = [DESKTOP_TYPE, FIREFLY_TYPE] as const;

/**
 * Check if a session type supports custom resource allocation
 */
export function supportsCustomResources(sessionType: string): boolean {
  return HAS_FIXED_RESOURCES.includes(sessionType as (typeof HAS_FIXED_RESOURCES)[number]);
}

/**
 * Get the default container image for a session type
 */
export function getDefaultImageForType(sessionType: string): string {
  return (
    DEFAULT_IMAGE_NAMES[sessionType as keyof typeof DEFAULT_IMAGE_NAMES] ||
    DEFAULT_NOTEBOOK_SKAHA_IMAGE
  );
}
