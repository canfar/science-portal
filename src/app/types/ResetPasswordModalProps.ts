/**
 * Props for ResetPasswordModal component
 */
export interface ResetPasswordModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when the modal is closed
   */
  onClose: () => void;

  /**
   * Whether the reset request is being processed
   */
  isLoading?: boolean;

  /**
   * Error message to display (if any)
   */
  errorMessage?: string;

  /**
   * Success message to display (if any)
   */
  successMessage?: string;
}

/**
 * Reset password request payload
 */
export interface ResetPasswordRequest {
  emailAddress: string;
  loginURI?: string;
  role?: string;
  pageLanguage?: string;
  reset_pass?: string;
}

/**
 * Reset password response
 */
export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
}
