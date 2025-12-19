import React from 'react';
import { PlatformLoadProps } from '../../types/PlatformLoadProps';
import { PlatformLoadImpl } from '../../implementation/platformLoad';

/**
 * PlatformLoad widget component for displaying system resource metrics
 *
 * Features:
 * - Shows CPU, RAM, and Instance usage with horizontal bar charts
 * - Loading state with progress bar
 * - Refresh functionality
 * - Last update timestamp
 * - Consistent Material-UI Paper design
 *
 * @example
 * ```tsx
 * <PlatformLoad
 *   data={{
 *     cpu: { name: 'CPU usage', used: 1215.1, free: 1487.5 },
 *     ram: { name: 'RAM usage', used: 8.2, free: 7.8 },
 *     instances: { name: 'Instances', used: 25, free: 75 },
 *     maxValues: { cpu: 2702.6, ram: 16, instances: 100 },
 *     lastUpdate: new Date()
 *   }}
 *   onRefresh={() => console.log('Refreshing...')}
 * />
 * ```
 */
export const PlatformLoad: React.FC<PlatformLoadProps> = (props) => {
  return <PlatformLoadImpl {...props} />;
};
