import type { PlatformLoadData } from '@/app/types/PlatformLoadProps';

/**
 * Silhouette data for the Platform Load widget when live stats are disabled (CADC-15555).
 * Matches opencadc/science-portal PR #158 — numbers are not shown clearly; the chart layer is blurred.
 */
export const STATIC_PLATFORM_LOAD_DATA: PlatformLoadData = {
  cpu: { name: 'CPU', used: 1094.838, free: 1911.162 },
  ram: { name: 'RAM', used: 9727.83, free: 2431.6100000000006 },
  maxValues: { cpu: 3006, ram: 12159.44 },
  lastUpdate: '2020-01-01T00:00:00.000Z',
};

export const PLATFORM_LOAD_DISABLED_MESSAGE =
  'The cluster capacity information widget is no longer available. A new capacity tool is being developed.';
