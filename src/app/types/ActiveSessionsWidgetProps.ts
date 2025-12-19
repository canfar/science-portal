import { SessionCardProps } from './SessionCardProps';

export interface ActiveSessionsWidgetProps {
  sessions: SessionCardProps[];
  operatingSessionIds?: Set<string>; // IDs of sessions currently being operated on (delete/renew)
  pollingSessionId?: string | null; // ID of session being polled after launch
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  showSessionCount?: boolean;
  maxSessionsToShow?: number;
  emptyMessage?: string;
  layout?: 'column' | 'row' | 'responsive';
  sessionCardMaxWidth?: string | number;
}
