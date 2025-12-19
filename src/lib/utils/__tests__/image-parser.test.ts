/**
 * Tests for Image Parser Utility
 */

import {
  isValidImageId,
  parseImageId,
  sortImages,
  groupImagesByTypeAndProject,
  getImagesForType,
  getImagesForTypeAndProject,
  getProjectNames,
  type RawImage,
  type ParsedImage,
  type ImagesByProject,
  type ImagesByTypeAndProject,
} from '../image-parser';

describe('isValidImageId', () => {
  it('should validate a correct image ID', () => {
    expect(isValidImageId('images.canfar.net/canucs/canucs:1.3.0')).toBe(true);
  });

  it('should validate latest tag', () => {
    expect(isValidImageId('images.canfar.net/skaha/notebook:latest')).toBe(
      true
    );
  });

  it('should reject image ID without version', () => {
    expect(isValidImageId('images.canfar.net/canucs/canucs')).toBe(false);
  });

  it('should reject image ID with only two parts', () => {
    expect(isValidImageId('registry.io/project')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidImageId('')).toBe(false);
  });

  it('should reject null or undefined', () => {
    expect(isValidImageId(null as any)).toBe(false);
    expect(isValidImageId(undefined as any)).toBe(false);
  });

  it('should reject non-string values', () => {
    expect(isValidImageId(123 as any)).toBe(false);
  });

  it('should reject image with empty version', () => {
    expect(isValidImageId('images.canfar.net/project/')).toBe(false);
  });

  it('should reject image with colon but no version', () => {
    expect(isValidImageId('images.canfar.net/project/:1.0')).toBe(false);
  });
});

describe('parseImageId', () => {
  it('should parse a standard image ID correctly', () => {
    const imageId = 'images.canfar.net/canucs/canucs:1.3.0';
    const result = parseImageId(imageId);

    expect(result).toEqual({
      registry: 'images.canfar.net',
      project: 'canucs',
      name: 'canucs:1.3.0',
      imageName: 'canucs',
      version: '1.3.0',
      label: 'canucs:1.3.0',
    });
  });

  it('should parse an image ID with latest tag', () => {
    const imageId = 'images.canfar.net/skaha/notebook:latest';
    const result = parseImageId(imageId);

    expect(result).toEqual({
      registry: 'images.canfar.net',
      project: 'skaha',
      name: 'notebook:latest',
      imageName: 'notebook',
      version: 'latest',
      label: 'notebook:latest',
    });
  });

  it('should return null for invalid image ID without version', () => {
    const imageId = 'images.canfar.net/project/image';
    const result = parseImageId(imageId);

    expect(result).toBeNull();
  });

  it('should return null for image ID with only two parts', () => {
    const imageId = 'registry.io/project';
    const result = parseImageId(imageId);

    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const imageId = '';
    const result = parseImageId(imageId);

    expect(result).toBeNull();
  });

  it('should parse complex version numbers', () => {
    const imageId = 'images.canfar.net/project/app:1.10.0';
    const result = parseImageId(imageId);

    expect(result?.version).toBe('1.10.0');
    expect(result?.imageName).toBe('app');
  });
});

describe('sortImages', () => {
  const createImage = (id: string): ParsedImage => {
    const parts = id.split('/');
    const [imageName, version] = parts[2].split(':');
    return {
      id,
      registry: parts[0],
      project: parts[1],
      name: parts[2],
      imageName,
      version,
      label: parts[2],
    };
  };

  it('should sort images alphabetically by name', () => {
    const images = [
      createImage('images.canfar.net/project/zebra:1.0'),
      createImage('images.canfar.net/project/alpha:1.0'),
      createImage('images.canfar.net/project/beta:1.0'),
    ];

    const sorted = sortImages(images);
    const names = sorted.map((img) => img.imageName);
    expect(names).toEqual(['alpha', 'beta', 'zebra']);
  });

  it('should sort versions with latest first for same image name', () => {
    const images = [
      createImage('images.canfar.net/project/app:2.0'),
      createImage('images.canfar.net/project/app:latest'),
      createImage('images.canfar.net/project/app:1.0'),
    ];

    const sorted = sortImages(images);
    const versions = sorted.map((img) => img.version);
    expect(versions).toEqual(['latest', '2.0', '1.0']);
  });

  it('should handle complex version numbers correctly', () => {
    const images = [
      createImage('images.canfar.net/project/app:1.10.0'),
      createImage('images.canfar.net/project/app:1.2.0'),
      createImage('images.canfar.net/project/app:latest'),
      createImage('images.canfar.net/project/app:1.1.0'),
    ];

    const sorted = sortImages(images);
    const versions = sorted.map((img) => img.version);
    expect(versions).toEqual(['latest', '1.10.0', '1.2.0', '1.1.0']);
  });

  it('should handle mixed image names and versions', () => {
    const images = [
      createImage('images.canfar.net/project/beta:2.0'),
      createImage('images.canfar.net/project/alpha:1.0'),
      createImage('images.canfar.net/project/beta:latest'),
      createImage('images.canfar.net/project/beta:1.0'),
    ];

    const sorted = sortImages(images);
    const names = sorted.map((img) => `${img.imageName}:${img.version}`);
    expect(names).toEqual([
      'alpha:1.0',
      'beta:latest',
      'beta:2.0',
      'beta:1.0',
    ]);
  });
});

describe('groupImagesByTypeAndProject', () => {
  it('should group images by type and project', () => {
    const rawImages: RawImage[] = [
      {
        id: 'images.canfar.net/canucs/canucs:1.3.0',
        types: ['notebook'],
      },
      {
        id: 'images.canfar.net/skaha/notebook:latest',
        types: ['notebook'],
      },
    ];

    const result = groupImagesByTypeAndProject(rawImages);

    expect(result.notebook.canucs).toHaveLength(1);
    expect(result.notebook.skaha).toHaveLength(1);
    expect(result.notebook.canucs[0].imageName).toBe('canucs');
    expect(result.notebook.canucs[0].version).toBe('1.3.0');
  });

  it('should exclude headless and desktop-app types', () => {
    const rawImages: RawImage[] = [
      {
        id: 'images.canfar.net/project/app:1.0',
        types: ['headless', 'desktop-app', 'notebook'],
      },
    ];

    const result = groupImagesByTypeAndProject(rawImages);

    expect(result.headless).toBeUndefined();
    expect(result['desktop-app']).toBeUndefined();
    expect(result.notebook).toBeDefined();
    expect(result.notebook.project).toHaveLength(1);
  });

  it('should handle multiple images in the same project', () => {
    const rawImages: RawImage[] = [
      {
        id: 'images.canfar.net/skaha/notebook:2.0',
        types: ['notebook'],
      },
      {
        id: 'images.canfar.net/skaha/notebook:latest',
        types: ['notebook'],
      },
      {
        id: 'images.canfar.net/skaha/notebook:1.0',
        types: ['notebook'],
      },
    ];

    const result = groupImagesByTypeAndProject(rawImages);

    expect(result.notebook.skaha).toHaveLength(3);
    // Check that images are sorted (latest first, then descending)
    const versions = result.notebook.skaha.map((img) => img.version);
    expect(versions).toEqual(['latest', '2.0', '1.0']);
  });

  it('should handle images with multiple types', () => {
    const rawImages: RawImage[] = [
      {
        id: 'images.canfar.net/project/multi-type:1.0',
        types: ['notebook', 'desktop', 'carta'],
      },
    ];

    const result = groupImagesByTypeAndProject(rawImages);

    // Image should appear in all three types (excluding headless/desktop-app)
    expect(result.notebook.project).toHaveLength(1);
    expect(result.desktop.project).toHaveLength(1);
    expect(result.carta.project).toHaveLength(1);

    // All should reference the same image ID
    expect(result.notebook.project[0].id).toBe(
      'images.canfar.net/project/multi-type:1.0'
    );
    expect(result.desktop.project[0].id).toBe(
      'images.canfar.net/project/multi-type:1.0'
    );
    expect(result.carta.project[0].id).toBe(
      'images.canfar.net/project/multi-type:1.0'
    );
  });

  it('should skip images with invalid IDs', () => {
    const rawImages: RawImage[] = [
      {
        id: 'invalid/id',
        types: ['notebook'],
      },
      {
        id: 'images.canfar.net/skaha/notebook:latest',
        types: ['notebook'],
      },
      {
        id: 'images.canfar.net/project/noversion',
        types: ['notebook'],
      },
    ];

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = groupImagesByTypeAndProject(rawImages);

    expect(result.notebook.skaha).toHaveLength(1);
    expect(result.notebook.skaha[0].id).toBe(
      'images.canfar.net/skaha/notebook:latest'
    );
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

    consoleWarnSpy.mockRestore();
  });

  it('should return empty object for empty input', () => {
    const rawImages: RawImage[] = [];
    const result = groupImagesByTypeAndProject(rawImages);

    expect(result).toEqual({});
  });

  it('should handle null and undefined inputs', () => {
    expect(groupImagesByTypeAndProject(null as any)).toEqual({});
    expect(groupImagesByTypeAndProject(undefined as any)).toEqual({});
  });

  it('should handle images without types property', () => {
    const rawImages = [
      {
        id: 'images.canfar.net/project/image:1.0',
      },
    ] as RawImage[];

    const result = groupImagesByTypeAndProject(rawImages);
    expect(result).toEqual({});
  });

  it('should sort images within projects by name and version', () => {
    const rawImages: RawImage[] = [
      {
        id: 'images.canfar.net/project/zebra:1.0',
        types: ['notebook'],
      },
      {
        id: 'images.canfar.net/project/alpha:latest',
        types: ['notebook'],
      },
      {
        id: 'images.canfar.net/project/alpha:1.0',
        types: ['notebook'],
      },
    ];

    const result = groupImagesByTypeAndProject(rawImages);
    const names = result.notebook.project.map(
      (img) => `${img.imageName}:${img.version}`
    );
    expect(names).toEqual(['alpha:latest', 'alpha:1.0', 'zebra:1.0']);
  });
});

describe('getImagesForType', () => {
  const testData: ImagesByTypeAndProject = {
    notebook: {
      canucs: [
        {
          id: 'images.canfar.net/canucs/canucs:1.3.0',
          registry: 'images.canfar.net',
          project: 'canucs',
          name: 'canucs:1.3.0',
          imageName: 'canucs',
          version: '1.3.0',
          label: 'canucs:1.3.0',
        },
      ],
      skaha: [
        {
          id: 'images.canfar.net/skaha/notebook:latest',
          registry: 'images.canfar.net',
          project: 'skaha',
          name: 'notebook:latest',
          imageName: 'notebook',
          version: 'latest',
          label: 'notebook:latest',
        },
      ],
    },
    desktop: {
      skaha: [
        {
          id: 'images.canfar.net/skaha/desktop:latest',
          registry: 'images.canfar.net',
          project: 'skaha',
          name: 'desktop:latest',
          imageName: 'desktop',
          version: 'latest',
          label: 'desktop:latest',
        },
      ],
    },
  };

  it('should return all images for a given type', () => {
    const result = getImagesForType(testData, 'notebook');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('images.canfar.net/canucs/canucs:1.3.0');
    expect(result[1].id).toBe('images.canfar.net/skaha/notebook:latest');
  });

  it('should return empty array for non-existent type', () => {
    const result = getImagesForType(testData, 'carta');

    expect(result).toEqual([]);
  });

  it('should return single image for type with one project', () => {
    const result = getImagesForType(testData, 'desktop');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('images.canfar.net/skaha/desktop:latest');
  });
});

describe('getImagesForTypeAndProject', () => {
  const testData: ImagesByTypeAndProject = {
    notebook: {
      canucs: [
        {
          id: 'images.canfar.net/canucs/canucs:1.3.0',
          registry: 'images.canfar.net',
          project: 'canucs',
          name: 'canucs:1.3.0',
          imageName: 'canucs',
          version: '1.3.0',
          label: 'canucs:1.3.0',
        },
        {
          id: 'images.canfar.net/canucs/canucs:1.2.0',
          registry: 'images.canfar.net',
          project: 'canucs',
          name: 'canucs:1.2.0',
          imageName: 'canucs',
          version: '1.2.0',
          label: 'canucs:1.2.0',
        },
      ],
      skaha: [
        {
          id: 'images.canfar.net/skaha/notebook:latest',
          registry: 'images.canfar.net',
          project: 'skaha',
          name: 'notebook:latest',
          imageName: 'notebook',
          version: 'latest',
          label: 'notebook:latest',
        },
      ],
    },
  };

  it('should return images for specific type and project', () => {
    const result = getImagesForTypeAndProject(testData, 'notebook', 'canucs');

    expect(result).toHaveLength(2);
    expect(result[0].version).toBe('1.3.0');
    expect(result[1].version).toBe('1.2.0');
  });

  it('should return empty array for non-existent type', () => {
    const result = getImagesForTypeAndProject(testData, 'desktop', 'canucs');

    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent project', () => {
    const result = getImagesForTypeAndProject(testData, 'notebook', 'unknown');

    expect(result).toEqual([]);
  });

  it('should return single image when project has one image', () => {
    const result = getImagesForTypeAndProject(testData, 'notebook', 'skaha');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('images.canfar.net/skaha/notebook:latest');
  });
});

describe('getProjectNames', () => {
  it('should return sorted project names from project map', () => {
    const projectMap: ImagesByProject = {
      skaha: [],
      canucs: [],
      lsst: [],
    };

    expect(getProjectNames(projectMap)).toEqual(['canucs', 'lsst', 'skaha']);
  });

  it('should handle empty project map', () => {
    expect(getProjectNames({})).toEqual([]);
  });

  it('should handle null or undefined inputs', () => {
    expect(getProjectNames(null as any)).toEqual([]);
    expect(getProjectNames(undefined as any)).toEqual([]);
  });

  it('should sort case-insensitively', () => {
    const projectMap: ImagesByProject = {
      Zebra: [],
      alpha: [],
      Beta: [],
    };

    const result = getProjectNames(projectMap);
    expect(result).toEqual(['alpha', 'Beta', 'Zebra']);
  });
});
