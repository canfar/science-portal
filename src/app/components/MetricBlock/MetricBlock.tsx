import React from 'react';
import { MetricBlockProps } from '../../types/MetricBlockProps';
import { MetricBlockImpl } from '../../implementation/metricBlock';

/**
 * MetricBlock component for displaying metric data with horizontal bar chart
 *
 * Features:
 * - Displays metric label and data using BarChartHorizontal
 * - Consistent styling with the design system
 * - Used as building block for dashboard widgets
 *
 * @example
 * ```tsx
 * <MetricBlock
 *   label="CPU"
 *   series={{ name: 'CPU usage', used: 65, free: 35 }}
 *   max={100}
 * />
 * ```
 */
export const MetricBlock: React.FC<MetricBlockProps> = (props) => {
  return <MetricBlockImpl {...props} />;
};
