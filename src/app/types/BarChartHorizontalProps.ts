import { CSSProperties } from 'react';

/**
 * Data structure for horizontal bar chart segments
 */
export interface BarChartDataItem {
  /**
   * The name/label for the bar (e.g., 'CPU usage')
   */
  name: string;
  /**
   * The used/occupied value
   */
  used: number;
  /**
   * The free/available value
   */
  free: number;
  /**
   * Optional additional data properties for custom segments
   */
  [key: string]: number | string | undefined;
}

/**
 * Legend configuration for the chart
 */
export interface BarChartLegendConfig {
  /**
   * Whether to show the legend
   * @default true
   */
  show?: boolean;
  /**
   * Position of the legend
   * @default 'bottom'
   */
  position?: 'top' | 'bottom';
  /**
   * Custom legend items (defaults to 'used' and 'free')
   */
  items?: Array<{
    key: string;
    label: string;
    color?: string;
  }>;
}

/**
 * Color configuration for the chart
 */
export interface BarChartColorConfig {
  /**
   * Color for the 'used' segment
   * @default theme primary color
   */
  used?: string;
  /**
   * Color for the 'free' segment
   * @default theme neutral color
   */
  free?: string;
  /**
   * Additional colors for custom segments
   */
  [key: string]: string | undefined;
}

/**
 * Axis configuration
 */
export interface BarChartAxisConfig {
  /**
   * Whether to show the X axis
   * @default true
   */
  showXAxis?: boolean;
  /**
   * Whether to show the Y axis
   * @default true
   */
  showYAxis?: boolean;
  /**
   * Custom ticks for X axis
   */
  xAxisTicks?: number[];
  /**
   * Format function for X axis labels
   */
  xAxisFormatter?: (value: number) => string;
}

/**
 * Props for the BarChartHorizontal component
 */
export interface BarChartHorizontalProps {
  /**
   * The data to display in the chart
   */
  data: BarChartDataItem[];
  /**
   * Optional title to display above the chart
   */
  title?: string;
  /**
   * Total value for the X axis domain
   * If not provided, will be calculated from data
   */
  total?: number;
  /**
   * Height of the chart in pixels
   * @default 80
   */
  height?: number;
  /**
   * Width of the chart (can be number for pixels or string for percentage)
   * @default '100%'
   */
  width?: number | string;
  /**
   * Maximum width of the chart container
   * @default '650px'
   */
  maxWidth?: string;
  /**
   * Bar size/thickness in pixels
   * @default 35
   */
  barSize?: number;
  /**
   * Border radius for the bars
   * @default 6
   */
  borderRadius?: number;
  /**
   * Legend configuration
   */
  legend?: BarChartLegendConfig;
  /**
   * Color configuration
   */
  colors?: BarChartColorConfig;
  /**
   * Axis configuration
   */
  axes?: BarChartAxisConfig;
  /**
   * Custom class name for the container
   */
  className?: string;
  /**
   * Custom styles for the container
   */
  style?: CSSProperties;
  /**
   * Keys to stack in the bar chart
   * @default ['used', 'free']
   */
  stackKeys?: string[];
  /**
   * Margin configuration for the chart
   */
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}
