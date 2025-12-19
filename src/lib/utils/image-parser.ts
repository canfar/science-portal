/**
 * Image Parser Utility
 *
 * Parses and transforms container image data from SKAHA API format
 * into a structured format organized by type and project.
 */

import type { SessionType } from '@/lib/api/skaha';

// Session types to exclude from grouping
const EXCLUDED_TYPES = ['desktop-app', 'headless'];

/**
 * Raw image data from SKAHA API
 */
export interface RawImage {
  id: string;
  types: SessionType[];
}

/**
 * Parsed image with extracted components
 */
export interface ParsedImage {
  id: string;
  registry: string;
  project: string;
  name: string; // Full name with version (e.g., "canucs:1.3.0")
  imageName: string; // Image name without version (e.g., "canucs")
  version: string; // Version tag (e.g., "1.3.0" or "latest")
  label: string; // Display label (same as name)
}

/**
 * Images grouped by project
 */
export interface ImagesByProject {
  [projectName: string]: ParsedImage[];
}

/**
 * Images grouped by type, then by project
 */
export interface ImagesByTypeAndProject {
  [sessionType: string]: ImagesByProject;
}

/**
 * Validate that an image ID has all required components
 *
 * @param imageId - Full image ID to validate
 * @returns True if the image ID is valid, false otherwise
 *
 * @example
 * isValidImageId('images.canfar.net/canucs/canucs:1.3.0') // true
 * isValidImageId('images.canfar.net/canucs/canucs') // false (no version)
 * isValidImageId('invalid/id') // false (missing registry)
 */
export function isValidImageId(imageId: string): boolean {
  if (!imageId || typeof imageId !== 'string') {
    return false;
  }

  const parts = imageId.split('/');
  if (parts.length !== 3) {
    return false;
  }

  const [registry, project, imageWithVersion] = parts;
  if (!registry || !project || !imageWithVersion) {
    return false;
  }

  const [imageName, version] = imageWithVersion.split(':');
  return Boolean(imageName && version);
}

/**
 * Parse an image ID into its components
 *
 * @param imageId - Full image ID in format: {registry}/{project}/{image_name:version}
 * @returns Parsed image components or null if parsing fails
 *
 * @example
 * parseImageId('images.canfar.net/canucs/canucs:1.3.0')
 * // Returns:
 * // {
 * //   registry: 'images.canfar.net',
 * //   project: 'canucs',
 * //   name: 'canucs:1.3.0',
 * //   imageName: 'canucs',
 * //   version: '1.3.0',
 * //   label: 'canucs:1.3.0'
 * // }
 */
export function parseImageId(imageId: string): Omit<ParsedImage, 'id'> | null {
  if (!isValidImageId(imageId)) {
    return null;
  }

  const parts = imageId.split('/');
  const registry = parts[0];
  const project = parts[1];
  const imageWithVersion = parts[2];

  const [imageName, version] = imageWithVersion.split(':');
  const name = imageWithVersion;

  return {
    registry,
    project,
    name,
    imageName,
    version: version || '',
    label: name,
  };
}

/**
 * Sort images by name and version
 * - Images are sorted alphabetically by image name
 * - For images with same name, 'latest' version comes first, then by version descending
 *
 * @param images - Array of parsed images to sort
 * @returns Sorted array of images
 */
export function sortImages(images: ParsedImage[]): ParsedImage[] {
  return [...images].sort((a, b) => {
    if (a.imageName === b.imageName) {
      // Handle version comparison for same image names
      if (a.version === 'latest') return -1;
      if (b.version === 'latest') return 1;
      return b.version.localeCompare(a.version, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    }
    // Sort image names alphabetically
    return a.imageName.localeCompare(b.imageName, undefined, {
      sensitivity: 'base',
    });
  });
}

/**
 * Transform raw images array into a structure grouped by type and project
 *
 * @param rawImages - Array of raw images from SKAHA API
 * @returns Images organized by session type, then by project name (sorted)
 *
 * @example
 * const rawImages = [
 *   {
 *     id: 'images.canfar.net/canucs/canucs:1.3.0',
 *     types: ['headless', 'notebook']
 *   },
 *   {
 *     id: 'images.canfar.net/skaha/notebook:latest',
 *     types: ['notebook']
 *   }
 * ];
 *
 * const grouped = groupImagesByTypeAndProject(rawImages);
 * // Returns (headless is excluded):
 * // {
 * //   notebook: {
 * //     canucs: [{
 * //       id: 'images.canfar.net/canucs/canucs:1.3.0',
 * //       registry: 'images.canfar.net',
 * //       project: 'canucs',
 * //       name: 'canucs:1.3.0',
 * //       imageName: 'canucs',
 * //       version: '1.3.0',
 * //       label: 'canucs:1.3.0'
 * //     }],
 * //     skaha: [{
 * //       id: 'images.canfar.net/skaha/notebook:latest',
 * //       registry: 'images.canfar.net',
 * //       project: 'skaha',
 * //       name: 'notebook:latest',
 * //       imageName: 'notebook',
 * //       version: 'latest',
 * //       label: 'notebook:latest'
 * //     }]
 * //   }
 * // }
 */
export function groupImagesByTypeAndProject(
  rawImages: RawImage[]
): ImagesByTypeAndProject {
  if (!Array.isArray(rawImages)) {
    return {};
  }

  const result: ImagesByTypeAndProject = {};

  for (const rawImage of rawImages) {
    if (!rawImage?.types || !Array.isArray(rawImage.types)) {
      continue;
    }

    // Parse the image ID
    const parsed = parseImageId(rawImage.id);

    if (!parsed) {
      console.warn(`Failed to parse image ID: ${rawImage.id}`);
      continue;
    }

    const image: ParsedImage = {
      id: rawImage.id,
      ...parsed,
    };

    // Add this image to each of its types
    for (const type of rawImage.types) {
      // Skip excluded types (desktop-app, headless)
      if (EXCLUDED_TYPES.includes(type)) {
        continue;
      }

      // Initialize type if it doesn't exist
      if (!result[type]) {
        result[type] = {};
      }

      // Initialize project array if it doesn't exist
      if (!result[type][image.project]) {
        result[type][image.project] = [];
      }

      // Add the image to the project
      result[type][image.project].push(image);
    }
  }

  // Sort images within each project
  for (const type in result) {
    for (const project in result[type]) {
      result[type][project] = sortImages(result[type][project]);
    }
  }

  return result;
}

/**
 * Get all images for a specific session type
 *
 * @param imagesByType - Images grouped by type and project
 * @param sessionType - The session type to retrieve images for
 * @returns Array of all images for the given session type
 */
export function getImagesForType(
  imagesByType: ImagesByTypeAndProject,
  sessionType: string
): ParsedImage[] {
  const projectImages = imagesByType[sessionType];

  if (!projectImages) {
    return [];
  }

  return Object.values(projectImages).flat();
}

/**
 * Get all images for a specific session type and project
 *
 * @param imagesByType - Images grouped by type and project
 * @param sessionType - The session type to retrieve images for
 * @param projectName - The project name to filter by
 * @returns Array of images for the given session type and project
 */
export function getImagesForTypeAndProject(
  imagesByType: ImagesByTypeAndProject,
  sessionType: string,
  projectName: string
): ParsedImage[] {
  return imagesByType[sessionType]?.[projectName] || [];
}

/**
 * Get sorted list of project names from grouped images
 *
 * @param imagesByProject - Images grouped by project
 * @returns Sorted array of project names
 */
export function getProjectNames(imagesByProject: ImagesByProject): string[] {
  if (!imagesByProject) {
    return [];
  }

  return Object.keys(imagesByProject).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
}
