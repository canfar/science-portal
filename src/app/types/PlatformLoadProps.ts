import { MetricSeries } from './MetricBlockProps';

/**
 * Platform load data structure
 */
export interface PlatformLoadData {
  /**
   * CPU metrics
   */
  cpu: MetricSeries;
  /**
   * RAM metrics
   */
  ram: MetricSeries;
  /**
   * Instance metrics
   */
  instances: MetricSeries;
  /**
   * Maximum values for each metric
   */
  maxValues: {
    cpu: number;
    ram: number;
    instances: number;
  };
  /**
   * Last update timestamp (string for API responses, Date for client-side)
   */
  lastUpdate: string | Date;
}

/**
 * Props for the PlatformLoad component
 */
export interface PlatformLoadProps {
  /**
   * Platform load data to display
   */
  data: PlatformLoadData;
  /**
   * Whether the component is currently loading
   * @default false
   */
  isLoading?: boolean;
  /**
   * Callback function when refresh button is clicked
   */
  onRefresh?: () => void;
  /**
   * Optional custom class name
   */
  className?: string;
  /**
   * Optional custom title (defaults to "Platform Load")
   */
  title?: string;
}
