import { DialogProps } from '@mui/material/Dialog';

export interface LoginModalProps
  extends Omit<DialogProps, 'children' | 'title' | 'onSubmit'> {
  /**
   * Dialog title (optional, defaults to "Login")
   */
  title?: React.ReactNode;
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback fired when the dialog requests to be closed
   */
  onClose?: (
    event: React.SyntheticEvent | Event,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => void;
  /**
   * Callback fired when login is successful
   */
  onLoginSuccess?: (username: string) => void;
  /**
   * Callback fired when login fails
   */
  onLoginError?: (error: string) => void;
  /**
   * Initial username value
   */
  initialUsername?: string;
  /**
   * Initial remember me checkbox state
   */
  initialRememberMe?: boolean;
  /**
   * Loading state from parent component
   */
  isLoading?: boolean;
  /**
   * Error message to display
   */
  errorMessage?: string;
  /**
   * Custom authentication handler
   */
  onSubmit?: (credentials: LoginCredentials) => void | Promise<void>;
  /**
   * Callback fired when user clicks "Forgot your Account information?"
   */
  onForgotPassword?: () => void;
  /**
   * Callback fired when user clicks "Request a CADC Account"
   */
  onRequestAccount?: () => void;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
}
