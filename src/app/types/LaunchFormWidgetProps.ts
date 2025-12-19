import { SessionLaunchFormProps } from './SessionLaunchFormProps';
import type { Session, SessionLaunchParams } from '@/lib/api/skaha';

export interface LaunchFormWidgetProps extends SessionLaunchFormProps {
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  showProgressIndicator?: boolean;
  progressPercentage?: number;
  helpUrl?: string;
  // Optional custom launch function to override default API call
  launchSessionFn?: (params: SessionLaunchParams) => Promise<Session>;
}
