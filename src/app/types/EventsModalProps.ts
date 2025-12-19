/**
 * Event type for container startup logs
 */
export type EventType = 'Normal' | 'Warning' | 'Error';

/**
 * Event reason categories
 */
export type EventReason =
  | 'Scheduled'
  | 'Pulling'
  | 'Pulled'
  | 'Created'
  | 'Started'
  | 'Failed'
  | 'BackOff'
  | 'Unhealthy'
  | 'Killing'
  | 'Preempting';

/**
 * Individual event from Kubernetes
 */
export interface SessionEvent {
  id: string;
  type: EventType;
  reason: EventReason;
  message: string;
  firstTime: string | null;
  lastTime: string | null;
  count?: number;
}

/**
 * API response structure
 */
export interface EventsApiResponse {
  events: SessionEvent[];
  sessionId: string;
  timestamp: string;
}

/**
 * Props for the EventsModal component
 */
export interface EventsModalProps {
  /**
   * Controls whether the modal is open
   */
  open: boolean;

  /**
   * Session ID to fetch events for
   */
  sessionId: string;

  /**
   * Display name of the session
   */
  sessionName?: string;

  /**
   * Callback when the modal is closed
   */
  onClose: () => void;

  /**
   * Optional callback for refresh action
   */
  onRefresh?: () => void;

  /**
   * Optional custom endpoint for fetching events
   */
  eventsEndpoint?: string;

  /**
   * Optional initial events data (for testing)
   */
  initialEvents?: SessionEvent[];

  /**
   * Auto-refresh interval in milliseconds
   */
  refreshInterval?: number;

  /**
   * Maximum number of events to display
   */
  maxEvents?: number;

  /**
   * Show refresh button
   */
  showRefreshButton?: boolean;

  /**
   * Enable auto-scroll to latest events
   */
  autoScroll?: boolean;

  /**
   * Force raw view mode (disable parsing toggle)
   */
  forceRawView?: boolean;

  /**
   * Default view mode (table or raw)
   */
  defaultView?: 'table' | 'raw';
}

/**
 * Hook return type for session events
 */
export interface UseSessionEventsReturn {
  events: SessionEvent[];
  rawData: string | null;
  loading: boolean;
  error: string | null;
  parseError: boolean;
  refresh: () => void;
}
