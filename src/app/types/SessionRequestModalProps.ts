/**
 * Status of the session request
 */
export type SessionRequestStatus = 'requesting' | 'provisioning' | 'error';

/**
 * Props for the SessionRequestModal component
 */
export interface SessionRequestModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * The name of the session being requested
   */
  sessionName: string;

  /**
   * The type of session being requested
   */
  sessionType: string;

  /**
   * Current status of the request
   */
  status: SessionRequestStatus;

  /**
   * Optional error message to display
   */
  errorMessage?: string;

  /**
   * Callback when the modal should be closed
   */
  onClose: () => void;

  /**
   * Callback when user clicks retry (for error state)
   */
  onRetry?: () => void;
}
