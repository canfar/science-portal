import { SessionCardProps } from './SessionCardProps';

export interface ActiveSessionsWidgetProps {
  sessions: SessionCardProps[];
  operatingSessionIds?: Set<string>; // IDs of sessions currently being operated on (delete/renew)
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  showSessionCount?: boolean;
  maxSessionsToShow?: number;
  emptyMessage?: string;
}
