import React from 'react';
import { BarChartHorizontalProps } from '../../types/BarChartHorizontalProps';
import { BarChartHorizontalImpl } from '../../implementation/barChartHorizontal';

/**
 * Horizontal bar chart component for displaying data comparisons
 *
 * Features:
 * - Stacked horizontal bar visualization
 * - Theme-aware colors and styling
 * - Customizable data segments
 * - Responsive design
 * - Built-in legend support
 * - Configurable axes and labels
 *
 * @example
 * ```tsx
 * <BarChartHorizontal
 *   title="Available CPUs: 1487.5 / 2702.6"
 *   data={[
 *     { name: 'CPU usage', used: 1215.1, free: 1486.9 }
 *   ]}
 *   total={2702.6}
 * />
 * ```
 */
export const BarChartHorizontal: React.FC<BarChartHorizontalProps> = (
  props
) => {
  return <BarChartHorizontalImpl {...props} />;
};
