/**
 * Props for RegistrationModal component
 */
export interface RegistrationModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when the modal is closed
   */
  onClose: () => void;

  /**
   * Whether the registration request is being processed
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
 * User registration form data
 */
export interface RegistrationFormData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  email: string;
  institute: string;
}

/**
 * Registration form validation errors
 */
export interface RegistrationFormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  institute?: string;
}

/**
 * Registration request payload (CADC format)
 */
export interface RegistrationRequest {
  userRequest: {
    user: {
      identities: {
        $: Array<{
          identity: {
            '@type': string;
            $: string;
          };
        }>;
      };
      personalDetails: {
        firstName: { $: string };
        lastName: { $: string };
        email: { $: string };
        institute: { $: string };
      };
    };
    password: { $: string };
  };
}

/**
 * Registration response
 */
export interface RegistrationResponse {
  success: boolean;
  message?: string;
}
